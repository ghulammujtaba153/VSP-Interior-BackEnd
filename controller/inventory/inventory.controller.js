import db from '../../models/index.js';
import { Sequelize, Op } from "sequelize";
const {Inventory, Audit, Suppliers, PriceBookCategory, PriceBook} = db;

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

    const { Inventory, Suppliers, PriceBookCategory, PriceBook } = db;

    // 2️⃣ Fetch all suppliers, categories, and pricebooks
    const allSuppliers = await Suppliers.findAll({});
    const allCategories = await PriceBookCategory.findAll({});
    const allPriceBooks = await PriceBook.findAll({});
    
    console.log("allSuppliers", allSuppliers);
    console.log("allCategories", allCategories);
    console.log("allPriceBooks", allPriceBooks);

    // Map supplier name → supplierId
    const supplierNameToId = new Map();
    allSuppliers.forEach(({ id, name }) => {
      if (name) supplierNameToId.set(name.toLowerCase().trim(), id);
    });

    // Map category name + supplierId → categoryId
    const categoryMap = new Map();
    allCategories.forEach(({ id, name, supplierId }) => {
      const key = `${supplierId}_${name.toLowerCase().trim()}`;
      categoryMap.set(key, id);
    });

    // Map pricebook name + categoryId → pricebookId
    const priceBookMap = new Map();
    allPriceBooks.forEach(({ id, name, priceBookCategoryId }) => {
      const key = `${priceBookCategoryId}_${name.toLowerCase().trim()}`;
      priceBookMap.set(key, id);
    });

    // 3️⃣ Cache for categories and pricebooks
    const categoryCache = new Map(); // {supplierId_categoryName: categoryId}
    const priceBookCache = new Map(); // {categoryId_priceBookName: {priceBookId, unit}}

    // Helper: Get category - DO NOT CREATE, just lookup
    const getCategory = (supplierId, categoryName) => {
      const cacheKey = `${supplierId}_${categoryName.toLowerCase().trim()}`;
      
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

    // Helper: Get pricebook - DO NOT CREATE, just lookup
    const getPriceBook = (categoryId, priceBookName) => {
      const cacheKey = `${categoryId}_${priceBookName.toLowerCase().trim()}`;
      
      // Check cache first
      if (priceBookCache.has(cacheKey)) {
        const cached = priceBookCache.get(cacheKey);
        return { priceBookId: cached.priceBookId, unit: cached.unit };
      }
      
      // Look up in pre-fetched map
      const priceBookId = priceBookMap.get(cacheKey);
      if (priceBookId) {
        const priceBook = allPriceBooks.find(pb => pb.id === priceBookId);
        if (priceBook) {
          priceBookCache.set(cacheKey, { priceBookId: priceBook.id, unit: priceBook.unit });
          return { priceBookId: priceBook.id, unit: priceBook.unit };
        }
      }
      
      return null; // Price book not found
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
          priceBook: item.priceBook || "(not provided)",
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
          priceBook: item.priceBook || "(not provided)",
          reason: "Supplier not found in database. Please add the supplier first.",
        });
        continue;
      }

      // Get category - REQUIRED field in model
      const categoryName = item.category || item.categoryName;
      if (!categoryName) {
        skippedSuppliers.push({
          itemName: item.name,
          supplierName: supplierName,
          category: "(not provided)",
          priceBook: item.priceBook || "(not provided)",
          reason: "Category is required. Please add category to the supplier first.",
        });
        continue;
      }

      const categoryId = getCategory(supplierId, categoryName);
      if (!categoryId) {
        skippedSuppliers.push({
          itemName: item.name,
          supplierName: supplierName,
          category: categoryName,
          priceBook: item.priceBook || "(not provided)",
          reason: `Category "${categoryName}" not found for this supplier. Please add the category first.`,
        });
        continue;
      }

      // Get pricebook (optional)
      const priceBookName = item.priceBook || item.priceBookName;
      let priceBookId = null;
      if (priceBookName) {
        const priceBook = getPriceBook(categoryId, priceBookName);
        if (!priceBook) {
          skippedSuppliers.push({
            itemName: item.name,
            supplierName: supplierName,
            category: categoryName,
            priceBook: priceBookName,
            reason: `Price book "${priceBookName}" not found for this category. Please add the price book first.`,
          });
          continue;
        }
        priceBookId = priceBook.priceBookId;
      }

      // Build inventory item
      const inventoryItem = {
        name: item.name?.trim(),
        description: item.description?.trim() || null,
        category: categoryId, // REQUIRED field in model
        priceBookId: priceBookId,
        supplierId: supplierId,
        costPrice: item.costPrice || 0,
        quantity: item.quantity || 0,
        notes: item.notes?.trim() || null,
        status: item.status?.toLowerCase() === "active" ? "active" : "inactive",
      };

      processedInventory.push(inventoryItem);
    }

    // 5️⃣ Check if there are any items to insert
    if (processedInventory.length === 0) {
      return res.status(400).json({
        message: "No valid items to insert. Please check the errors below and add missing suppliers, categories, or pricebooks first.",
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
        { model: db.PriceBook, as: "priceBooks" },
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