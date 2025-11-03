import db from "../../../models/index.js";
const { ProjectPurchase, PurchaseLineItem, ProjectSetup, Suppliers } = db;

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