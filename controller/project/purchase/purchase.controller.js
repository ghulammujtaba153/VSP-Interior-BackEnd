import db from "../../../models/index.js";
import { Op, fn, col, literal, Sequelize } from "sequelize";
const { ProjectPurchase, PurchaseLineItem, Suppliers, ProjectSetup, Inventory, Clients } = db;


import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads directory if it doesn’t exist
const uploadDir = path.resolve("uploads/purchases");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter 
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf" || file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/jpg") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

export const upload = multer({ storage, fileFilter });


export const createProjectPurchase = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        let { lineItems, ...purchaseData } = req.body;
        
        // Parse lineItems if it's a string (e.g., from FormData)
        if (typeof lineItems === 'string') {
            try {
                lineItems = JSON.parse(lineItems);
            } catch (e) {
                lineItems = [];
            }
        }
        
        // Handle projectId - set to null if "general"
        if (purchaseData.projectId === "general" || purchaseData.projectId === "") {
            purchaseData.projectId = null;
        }

        // Calculate totalAmount from lineItems if provided
        if (lineItems && Array.isArray(lineItems)) {
            purchaseData.totalAmount = lineItems.reduce((total, item) => {
                return total + (parseFloat(item.subtotal) || 0);
            }, 0);
        }

        // Handle attachments from uploaded files
        if (req.files && req.files.length > 0) {
            purchaseData.attachments = req.files.map(file => ({
                filename: file.filename,
                originalname: file.originalname,
                path: file.path,
                mimetype: file.mimetype
            }));
        }

        // Set status to "submit" if not provided
        if (!purchaseData.status) {
            purchaseData.status = "submit";
        }

        // Create the purchase order
        const purchase = await ProjectPurchase.create(purchaseData, { transaction });

        // Create line items if provided
        if (lineItems && Array.isArray(lineItems) && lineItems.length > 0) {
            const lineItemsData = lineItems
                .filter(item => item.itemId && item.quantity > 0) // Filter out empty items
                .map(item => ({
                    purchaseId: purchase.id,
                    itemId: parseInt(item.itemId),
                    description: item.description || "",
                    category: item.category || "",
                    quantity: parseFloat(item.quantity) || 0,
                    unit: item.unit || "",
                    unitPrice: parseFloat(item.unitPrice) || 0,
                    subtotal: parseFloat(item.subtotal) || 0,
                }));

            if (lineItemsData.length > 0) {
                await PurchaseLineItem.bulkCreate(lineItemsData, { transaction });
            }
        }

        await transaction.commit();

        // Fetch the complete purchase with associations
        const createdPurchase = await ProjectPurchase.findByPk(purchase.id, {
            include: [
                { model: ProjectSetup, as: "project" },
                { model: Suppliers, as: "suppliers" },
                { model: PurchaseLineItem, as: "lineItems" }
            ]
        });

        res.status(201).json({
            success: true,
            message: "Project purchase created successfully",
            data: createdPurchase
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Error creating project purchase:", error);
        res.status(500).json({
            success: false,
            message: "Error creating project purchase",
            error: error.message
        });
    }
}



export const getProjectPurchaseById = async (req, res) => {
    try {
        const purchase = await ProjectPurchase.findByPk(req.params.id, {
            include: [
                { model: ProjectSetup, as: "project" },
                { model: Suppliers, as: "suppliers" },
                { model: PurchaseLineItem, as: "lineItems" }
            ]
        });
        
        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Project purchase not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Project purchase fetched successfully",
            data: purchase
        });
    } catch (error) {
        console.error("Error fetching project purchase:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching project purchase",
            error: error.message
        });
    }
}


export const getAllProjectPurchases = async (req, res) => {
    const { page = 1, limit = 10, search = "", status, supplierId } = req.query;
    const offset = (page - 1) * limit;
    const whereConditions = {};
    
    // Search conditions
    if (search.trim() !== "") {
        whereConditions[db.Sequelize.Op.or] = [
            { notes: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        ];
    }
    
    // Status filter
    if (status) {
        whereConditions.status = status;
    }
    
    // Supplier filter
    if (supplierId) {
        whereConditions.supplierId = parseInt(supplierId);
    }

    try {
        const { count, rows } = await ProjectPurchase.findAndCountAll({
            where: whereConditions,
            include: [
                { model: ProjectSetup, as: "project" },
                { model: Suppliers, as: "suppliers" },
                { model: PurchaseLineItem, as: "lineItems" }
            ],
            offset: offset,
            limit: parseInt(limit),
            order: [['createdAt', 'DESC']],
            distinct: true
        });
        
        res.status(200).json({
            success: true,
            message: "All project purchases fetched successfully",
            data: rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: parseInt(limit)
            }
        });
    }
    catch (error) {
        console.error("Error fetching all project purchases:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching all project purchases",
            error: error.message
        });
    }
}

export const updateProjectPurchase = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const purchase = await ProjectPurchase.findByPk(req.params.id);
        if (!purchase) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: "Project purchase not found"
            });
        }

        let { lineItems, ...purchaseData } = req.body;
        
        // Parse lineItems if it's a string (e.g., from FormData)
        if (typeof lineItems === 'string') {
            try {
                lineItems = JSON.parse(lineItems);
            } catch (e) {
                lineItems = [];
            }
        }

        // Handle projectId - set to null if "general"
        if (purchaseData.projectId === "general" || purchaseData.projectId === "") {
            purchaseData.projectId = null;
        }

        // Calculate totalAmount from lineItems if provided
        if (lineItems && Array.isArray(lineItems)) {
            purchaseData.totalAmount = lineItems.reduce((total, item) => {
                return total + (parseFloat(item.subtotal) || 0);
            }, 0);
        }

        // Calculate deliveryStatus when status changes to "delivered"
        if (purchaseData.status === 'delivered' && purchase.expectedDelivery) {
            const expectedDate = new Date(purchase.expectedDelivery);
            const actualDate = new Date(); // Current date when status is set to delivered
            
            if (actualDate < expectedDate) {
                purchaseData.deliveryStatus = 'early';
            } else if (actualDate <= new Date(expectedDate.getTime() + 24 * 60 * 60 * 1000)) {
                // Allow 1 day buffer for "on-time"
                purchaseData.deliveryStatus = 'on-time';
            } else {
                purchaseData.deliveryStatus = 'late';
            }
        }

        // Handle attachments - check if existingAttachments is provided in FormData
        let existingAttachmentsArray = purchase.attachments || [];
        if (req.body.existingAttachments) {
            try {
                existingAttachmentsArray = typeof req.body.existingAttachments === 'string' 
                    ? JSON.parse(req.body.existingAttachments)
                    : req.body.existingAttachments;
            } catch (e) {
                console.error("Error parsing existingAttachments:", e);
                existingAttachmentsArray = purchase.attachments || [];
            }
        }

        // Handle new attachments from uploaded files
        if (req.files && req.files.length > 0) {
            const newAttachments = req.files.map(file => ({
                filename: file.filename,
                originalname: file.originalname,
                path: file.path,
                mimetype: file.mimetype
            }));
            // Merge existing with new attachments
            purchaseData.attachments = [...existingAttachmentsArray, ...newAttachments];
        } else {
            // No new files, but we might have updated existing attachments
            purchaseData.attachments = existingAttachmentsArray;
        }

        // Update the purchase order
        await purchase.update(purchaseData, { transaction });

        // Update line items - delete old ones and create new ones
        if (lineItems && Array.isArray(lineItems)) {
            // Delete existing line items
            await PurchaseLineItem.destroy({
                where: { purchaseId: purchase.id },
                transaction
            });

            // Create new line items
            const lineItemsData = lineItems
                .filter(item => item.itemId && item.quantity > 0) // Filter out empty items
                .map(item => ({
                    purchaseId: purchase.id,
                    itemId: parseInt(item.itemId),
                    description: item.description || "",
                    category: item.category || "",
                    quantity: parseFloat(item.quantity) || 0,
                    unit: item.unit || "",
                    unitPrice: parseFloat(item.unitPrice) || 0,
                    subtotal: parseFloat(item.subtotal) || 0,
                }));

            if (lineItemsData.length > 0) {
                await PurchaseLineItem.bulkCreate(lineItemsData, { transaction });
            }
        }

        await transaction.commit();

        // Fetch the complete purchase with associations
        const updatedPurchase = await ProjectPurchase.findByPk(purchase.id, {
            include: [
                { model: ProjectSetup, as: "project" },
                { model: Suppliers, as: "suppliers" },
                { model: PurchaseLineItem, as: "lineItems" }
            ]
        });

        return res.status(200).json({
            success: true,
            message: "Project purchase updated successfully",
            data: updatedPurchase
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Error updating project purchase:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating project purchase",
            error: error.message
        });
    }
}


export const deleteProjectPurchase = async (req, res) => {
    try {
        const purchase = await ProjectPurchase.findByPk(req.params.id);
        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Project purchase not found"
            });
        }
        
        await purchase.destroy();
        return res.status(200).json({
            success: true,
            message: "Project purchase deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting project purchase:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting project purchase",
            error: error.message
        });
    }
}



export const getPurchaseDashboardStats = async (req, res) => {
  try {
    // ---- 1️⃣ Basic Stats ----
    const totalOrders = await ProjectPurchase.count();
    const statusCounts = await ProjectPurchase.findAll({
      attributes: [
        ["status", "status"],
        [fn("COUNT", col("ProjectPurchase.id")), "count"]
      ],
      group: ["status"],
      raw: true,
    });

    // ---- 2️⃣ Financial Stats ----
    const totalSpendData = await ProjectPurchase.findAll({
      attributes: [
        [fn("SUM", col("ProjectPurchase.totalAmount")), "totalSpend"],
        [fn("AVG", col("ProjectPurchase.totalAmount")), "avgOrderValue"],
      ],
      raw: true,
    });
    const { totalSpend, avgOrderValue } = totalSpendData[0] || {};

    // ---- 3️⃣ Top 5 Suppliers by Spend ----
    const topSuppliers = await ProjectPurchase.findAll({
      attributes: [
        [col("ProjectPurchase.supplierId"), "supplierId"],
        [fn("SUM", col("ProjectPurchase.totalAmount")), "totalSpend"],
        [fn("COUNT", col("ProjectPurchase.id")), "totalOrders"],
      ],
      include: [{ model: Suppliers, as: "suppliers", attributes: ["name"], required: false }],
      group: [col("ProjectPurchase.supplierId"), col("suppliers.id")],
      order: [[fn("SUM", col("ProjectPurchase.totalAmount")), "DESC"]],
      limit: 5,
    });

    // ---- 4️⃣ Project-wise Spend ----
    const projectSpendRaw = await ProjectPurchase.findAll({
      attributes: [
        [col("ProjectPurchase.projectId"), "projectId"],
        [
          fn("COALESCE", col("project.projectName"), literal("'General Stock'")),
          "projectName"
        ],
        [fn("SUM", col("ProjectPurchase.totalAmount")), "totalSpent"],
        [col("project.id"), "projectIdForJoin"],
      ],
      include: [
        {
          model: ProjectSetup,
          as: "project",
          
          required: false,
        },
      ],
      group: [
        col("ProjectPurchase.projectId"),
        col("project.id"),
        col("project.projectName"),
      ],
      order: [[fn("SUM", col("ProjectPurchase.totalAmount")), "DESC"]],
      raw: true,
      nest: true,
    });

    console.log("projectSpendRaw", projectSpendRaw);

    // Get unique project IDs (excluding null)
    const projectIds = [...new Set(projectSpendRaw.map(item => item.projectIdForJoin).filter(id => id !== null))];
    
    // Batch fetch all projects with clients
    const projectsWithClients = projectIds.length > 0 
      ? await ProjectSetup.findAll({
          where: { id: { [Op.in]: projectIds } },
          include: [
            {
              model: Clients,
              as: "client",
              required: false,
            },
          ],
        })
      : [];

      console.log("projectsWithClients", projectsWithClients);


    // Create a map for quick lookup
    const projectMap = new Map();
    projectsWithClients.forEach(project => {
      projectMap.set(project.id, {
        id: project.id,
        projectName: project.projectName,
        client: project.client ? {
          id: project.client.id,
          companyName: project.client.companyName,
        } : null,
      });
    });

    console.log("projectMap", projectSpendRaw);

    // Enrich with client information
    const projectSpend = projectSpendRaw.map(item => ({
      projectId: item.projectId,
      projectName: item.projectName,
      totalSpent: item.totalSpent,
      project: item.projectIdForJoin ? projectMap.get(item.projectIdForJoin) || null : null,
    }));

    // ---- 5️⃣ Monthly Spend Trend (last 6 months) ----
    const monthlyTrend = await ProjectPurchase.findAll({
      attributes: [
        [fn("DATE_TRUNC", "month", col("ProjectPurchase.createdAt")), "month"],
        [fn("SUM", col("ProjectPurchase.totalAmount")), "monthlySpend"],
        [fn("COUNT", col("ProjectPurchase.id")), "ordersCount"],
      ],
      group: [fn("DATE_TRUNC", "month", col("ProjectPurchase.createdAt"))],
      order: [[fn("DATE_TRUNC", "month", col("ProjectPurchase.createdAt")), "ASC"]],
      limit: 6,
    });

    // ---- 6️⃣ Inventory / Line Item Stats ----
    const itemStats = await PurchaseLineItem.findAll({
      attributes: [
        [col("PurchaseLineItem.itemId"), "itemId"],
        [fn("SUM", col("PurchaseLineItem.quantity")), "totalQuantity"],
        [fn("SUM", col("PurchaseLineItem.subtotal")), "totalSpent"],
      ],
      include: [
        {
          model: Inventory,
          as: "item",
          attributes: ["name", "category"],
          required: false,
        },
      ],
      group: [col("PurchaseLineItem.itemId"), col("item.id")],
      order: [[fn("SUM", col("PurchaseLineItem.quantity")), "DESC"]],
      limit: 5,
    });

    // ---- 7️⃣ Supplier Performance ----
    const supplierPerformance = await ProjectPurchase.findAll({
      attributes: [
        [col("ProjectPurchase.supplierId"), "supplierId"],
        [fn("COUNT", col("ProjectPurchase.id")), "totalOrders"],
        [
          fn("SUM", literal(`CASE WHEN "ProjectPurchase"."status" = 'delivered' THEN 1 ELSE 0 END`)),
          "deliveredOrders",
        ],
        [
          fn("SUM", literal(`CASE WHEN "ProjectPurchase"."status" = 'delayed' THEN 1 ELSE 0 END`)),
          "delayedOrders",
        ],
      ],
      include: [{ model: Suppliers, as: "suppliers", attributes: ["name"], required: false }],
      group: [col("ProjectPurchase.supplierId"), col("suppliers.id")],
    });

    // ---- 8️⃣ Attachments Stats ----
    const attachmentStats = await ProjectPurchase.findAll({
      attributes: [
        [fn("COUNT", literal(`CASE WHEN "ProjectPurchase"."attachments" IS NOT NULL THEN 1 END`)), "ordersWithAttachments"],
        [fn("SUM", literal(`CASE WHEN "ProjectPurchase"."attachments" IS NULL THEN 1 ELSE 0 END`)), "missingAttachments"],
      ],
      raw: true,
    });

    // ✅ FINAL RESPONSE
    return res.status(200).json({
      summary: {
        totalOrders,
        statusCounts,
        totalSpend: parseFloat(totalSpend || 0),
        avgOrderValue: parseFloat(avgOrderValue || 0),
      },
      topSuppliers,
      projectSpend,
      monthlyTrend,
      itemStats,
      supplierPerformance,
      attachmentStats: attachmentStats[0] || {},
    });

  } catch (error) {
    console.error("Error fetching purchase stats:", error);
    return res.status(500).json({ error: "Failed to fetch purchase stats", details: error.message });
  }
};
 
