import db from '../../models/index.js';
import { Sequelize, Op, fn, col } from "sequelize";
const {Inventory, Audit, Suppliers, PriceBookCategory, PriceBook, PurchaseLineItem} = db;

export const createInventory = async (req, res) => {
    try {
        const inventory = await Inventory.create(req.body);
        console.log(inventory);
        await Audit.create({ userId: req.body.userId, action: 'create', tableName: 'inventory', newData: inventory.get() });
        res.status(201).json({
            message: "Inventory created successfully",
            inventory
        });
    } catch (error) {
        res.status(500).json({              
            message: "Error creating inventory",
            error: error.message
        });
    }
}



export const importCSV = async (req, res) => {
  try {
    const { inventory, userId } = req.body;

    // 1️⃣ Validate input
    if (!Array.isArray(inventory) || inventory.length === 0) {
      return res.status(400).json({ message: "Invalid data format" });
    }

    const { Inventory, Suppliers, PriceBookCategory } = db;

    // 2️⃣ Fetch all suppliers and categories (categories are independent of suppliers)
    const allSuppliers = await Suppliers.findAll({});
    const allCategories = await PriceBookCategory.findAll({});
    
    console.log("allSuppliers", allSuppliers);
    console.log("allCategories", allCategories);

    // Map supplier name → supplierId
    const supplierNameToId = new Map();
    allSuppliers.forEach(({ id, name }) => {
      if (name) supplierNameToId.set(name.toLowerCase().trim(), id);
    });

    // Map category name → categoryId (categories are independent, no supplierId)
    const categoryMap = new Map();
    allCategories.forEach(({ id, name }) => {
      const key = name.toLowerCase().trim();
      categoryMap.set(key, id);
    });

    // 3️⃣ Cache for categories
    const categoryCache = new Map(); // {categoryName: categoryId}

    // Helper: Get category - DO NOT CREATE, just lookup
    const getCategory = (categoryName) => {
      const cacheKey = categoryName.toLowerCase().trim();
      
      // Check cache first
      if (categoryCache.has(cacheKey)) {
        return categoryCache.get(cacheKey);
      }
      
      // Look up in pre-fetched map
      const categoryId = categoryMap.get(cacheKey);
      if (categoryId) {
        categoryCache.set(cacheKey, categoryId);
        return categoryId;
      }
      
      return null; // Category not found
    };

    // 4️⃣ Process each inventory item
    const processedInventory = [];
    const skippedSuppliers = [];

    for (const item of inventory) {
      const supplierName = item?.supplierName?.trim();

      if (!supplierName) {
        skippedSuppliers.push({
          itemName: item.name || "(unnamed)",
          supplierName: "(empty/missing)",
          category: item.category || "(not provided)",
          reason: "Supplier name is missing",
        });
        continue;
      }

      const supplierId = supplierNameToId.get(supplierName.toLowerCase());

      if (!supplierId) {
        skippedSuppliers.push({
          itemName: item.name,
          supplierName: supplierName,
          category: item.category || "(not provided)",
          reason: "Supplier not found in database. Please add the supplier first.",
        });
        continue;
      }

      // Get category - REQUIRED field in model (independent of supplier)
      const categoryName = item.category || item.categoryName;
      if (!categoryName) {
        skippedSuppliers.push({
          itemName: item.name,
          supplierName: supplierName,
          category: "(not provided)",
          reason: "Category is required. Please add the category first.",
        });
        continue;
      }

      const categoryId = getCategory(categoryName);
      if (!categoryId) {
        skippedSuppliers.push({
          itemName: item.name,
          supplierName: supplierName,
          category: categoryName,
          reason: `Category "${categoryName}" not found. Please add the category first.`,
        });
        continue;
      }

      // Validate and map status to enum values
      let status = "In Stock"; // Default
      const statusValue = item.status?.trim();
      if (statusValue) {
        const normalizedStatus = statusValue.charAt(0).toUpperCase() + statusValue.slice(1).toLowerCase();
        if (["In Stock", "Low Stock", "Out of Stock"].includes(normalizedStatus)) {
          status = normalizedStatus;
        }
      }

      // Build inventory item
      const inventoryItem = {
        name: item.name?.trim(),
        description: item.description?.trim() || null,
        category: categoryId, // REQUIRED field in model
        supplierId: supplierId,
        costPrice: item.costPrice || 0,
        quantity: item.quantity || 0,
        notes: item.notes?.trim() || null,
        status: status,
      };

      processedInventory.push(inventoryItem);
    }

    // 5️⃣ Check if there are any items to insert
    if (processedInventory.length === 0) {
      return res.status(400).json({
        message: "No valid items to insert. Please check the errors below and add missing suppliers or categories first.",
        skippedCount: skippedSuppliers.length,
        skippedSuppliers,
      });
    }

    // 6️⃣ Deduplicate by name
    const uniqueByName = [];
    const seen = new Set();
    for (const item of processedInventory) {
      const name = item?.name?.trim()?.toLowerCase();
      if (name && !seen.has(name)) {
        uniqueByName.push(item);
        seen.add(name);
      }
    }
    console.log("processedInventory", processedInventory);
    
    // 7️⃣ Filter out existing inventory names
    const existing = await Inventory.findAll({ attributes: ["name"], raw: true });
    const existingNames = new Set(existing.map((e) => e.name.toLowerCase().trim()));
    console.log("existingNames", existingNames);
    const toInsert = uniqueByName.filter(
      (item) => !existingNames.has(item.name.toLowerCase().trim())
    );

    console.log("toInsert", toInsert);

    // 8️⃣ Insert new inventory
    const created =
      toInsert.length > 0
        ? await Inventory.bulkCreate(toInsert, { returning: true })
        : [];

    // 9️⃣ Audit log
    if (created.length > 0) {
      await Audit.create({
        userId,
        action: "import",
        tableName: "inventory",
        newData: created.map((r) => (r.get ? r.get() : r)),
      });
    }

    // 🔟 Prepare result
    return res.status(201).json({
      message: `Inventory import completed: ${created.length} inserted, ${skippedSuppliers.length} skipped.`,
      insertedCount: created.length,
      skippedCount: skippedSuppliers.length,
      skippedSuppliers,
      inventory: created,
    });
  } catch (error) {
    console.error("❌ Error importing CSV:", error);
    return res.status(500).json({ message: error.message });
  }
};



export const getInventory = async (req, res) => {
  const { page = 1, limit = 10, search = "", supplierId, categoryId, priceBookId, status } = req.query;
  const offset = (page - 1) * limit;
  const whereConditions = {};

  // Filter by supplier
  if (supplierId && supplierId.trim() !== "") {
    whereConditions.supplierId = supplierId;
  }

  // Filter by category
  if (categoryId && categoryId.trim() !== "") {
    whereConditions.category = categoryId;
  }

  // Filter by priceBook
  if (priceBookId && priceBookId.trim() !== "") {
    whereConditions.priceBookId = priceBookId;
  }

  // Filter by status
  if (status && status.trim() !== "") {
    whereConditions.status = status;
  }

  // Search logic
  if (search && search.trim() !== "") {
    whereConditions[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      Sequelize.where(
        Sequelize.cast(Sequelize.col("costPrice"), "TEXT"),
        { [Op.iLike]: `%${search}%` }
      ),
      Sequelize.where(
        Sequelize.cast(Sequelize.col("quantity"), "TEXT"),
        { [Op.iLike]: `%${search}%` }
      ),
    ];
  }

  try {
    const { rows, count } = await db.Inventory.findAndCountAll({
      include: [
        { model: db.Suppliers, as: "supplier" },
        { model: db.PriceBookCategory, as: "categoryDetails" },
        
      ],
      where: whereConditions,
      offset,
      limit: parseInt(limit, 10),
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Inventory fetched successfully",
      inventory: rows,
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching inventory",
      error: error.message,
    });
  }
};


export const updateInventory = async (req, res) => {
    try{
        const inventory = await Inventory.findByPk(req.params.id);
        if(!inventory){
            return res.status(404).json({
                message: "Inventory not found"
            });
        }
        await inventory.update(req.body);
        await Audit.create({ userId: req.body.userId, action: 'update', tableName: 'inventory', oldData: inventory.get(), newData: req.body });
        res.status(200).json({
            message: "Inventory updated successfully",
            inventory
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating inventory",
        });
    }
}



export const deleteInventory = async (req, res) => {
    try{
        const inventory = await Inventory.findByPk(req.params.id);
        if(!inventory){
            return res.status(404).json({
                message: "Inventory not found"
            });
        }
        await inventory.destroy();
        await Audit.create({ userId: req.body.userId, action: 'delete', tableName: 'inventory', oldData: inventory.get() });
        res.status(200).json({
            message: "Inventory deleted successfully",
        });
    } catch(error){
        res.status(500).json({
            message: "Error deleting inventory",
            error: error.message
        });
    }
}


export const getInventoryPerformanceReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    // Build date filter for purchase line items if provided
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
      if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
    }

    // ==================== 1. GET ALL INVENTORY ITEMS ====================
    const allInventory = await Inventory.findAll({
      attributes: ['id', 'name', 'costPrice', 'quantity', 'status'],
    });

    const totalItems = allInventory.length;
    
    // ==================== 2. CALCULATE TOTAL PRICE AND AVERAGE PRICE ====================
    let totalPrice = 0;
    let totalQuantity = 0;
    
    allInventory.forEach(item => {
      const costPrice = parseFloat(item.costPrice || 0);
      const quantity = parseInt(item.quantity || 0);
      totalPrice += costPrice * quantity;
      totalQuantity += quantity;
    });

    const averagePrice = totalItems > 0 ? (totalPrice / totalQuantity) : 0;

    // ==================== 3. GET ITEMS USED IN PROJECTS (PurchaseLineItem) ====================
    const lineItems = await PurchaseLineItem.findAll({
      where: dateFilter,
      attributes: [
        'itemId',
        [fn('SUM', col('quantity')), 'totalQuantityUsed'],
        [fn('SUM', col('subtotal')), 'totalValueUsed'],
        [fn('COUNT', col('id')), 'usageCount'],
      ],
      group: ['itemId'],
      raw: true,
    });

    const usedItemIds = new Set(lineItems.map(item => item.itemId));
    const itemsUsedInProjects = allInventory.filter(item => usedItemIds.has(item.id)).length;
    const itemsNotUsed = totalItems - itemsUsedInProjects;

    // ==================== 4. CREATE MAP OF ITEM USAGE ====================
    const itemUsageMap = new Map();
    lineItems.forEach(item => {
      itemUsageMap.set(item.itemId, {
        totalQuantityUsed: parseFloat(item.totalQuantityUsed || 0),
        totalValueUsed: parseFloat(item.totalValueUsed || 0),
        usageCount: parseInt(item.usageCount || 0),
      });
    });

    // ==================== 5. TOP ITEMS USED ====================
    const topItemsUsed = lineItems
      .map(item => {
        const inventoryItem = allInventory.find(inv => inv.id === item.itemId);
        if (!inventoryItem) return null;

        const usage = itemUsageMap.get(item.itemId);
        const costPrice = parseFloat(inventoryItem.costPrice || 0);
        const estimatedPriceGenerated = usage.totalValueUsed; // From PurchaseLineItem subtotal

        return {
          id: inventoryItem.id,
          name: inventoryItem.name,
          totalQuantityUsed: Math.round(usage.totalQuantityUsed),
          totalValueUsed: parseFloat(usage.totalValueUsed.toFixed(2)),
          usageCount: usage.usageCount,
          costPrice: parseFloat(costPrice.toFixed(2)),
          estimatedPriceGenerated: parseFloat(estimatedPriceGenerated.toFixed(2)),
        };
      })
      .filter(item => item !== null)
      .sort((a, b) => b.totalQuantityUsed - a.totalQuantityUsed)
      .slice(0, 10); // Top 10 items

    // ==================== 6. ITEMS BY STATUS ====================
    const statusCounts = {
      'In Stock': 0,
      'Low Stock': 0,
      'Out of Stock': 0,
    };

    const statusDetails = {
      'In Stock': [],
      'Low Stock': [],
      'Out of Stock': [],
    };

    allInventory.forEach(item => {
      const status = item.status || 'In Stock';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      const itemData = {
        id: item.id,
        name: item.name,
        quantity: parseInt(item.quantity || 0),
        costPrice: parseFloat(item.costPrice || 0),
        totalValue: parseFloat((item.costPrice || 0) * (item.quantity || 0)).toFixed(2),
      };

      if (!statusDetails[status]) {
        statusDetails[status] = [];
      }
      statusDetails[status].push(itemData);
    });

    return res.status(200).json({
      success: true,
      data: {
        totalItems,
        totalPrice: parseFloat(totalPrice.toFixed(2)),
        averagePrice: parseFloat(averagePrice.toFixed(2)),
        itemsUsedInProjects,
        itemsNotUsed,
        topItemsUsed,
        statusBreakdown: {
          counts: statusCounts,
          details: statusDetails,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching inventory performance report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory performance report',
      error: error.message,
    });
  }
};

