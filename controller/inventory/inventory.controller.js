import db from '../../models/index.js';
import { Sequelize, Op } from "sequelize";
const {Inventory, Audit, Suppliers} = db;

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

    // 2️⃣ Fetch all suppliers (only id & name)
    const allSuppliers = await Suppliers.findAll({});
    console.log("allSuppliers", allSuppliers);

    // Map supplier name → supplierId
    const supplierNameToId = new Map();
    allSuppliers.forEach(({ id, name }) => {
      if (name) supplierNameToId.set(name.toLowerCase().trim(), id);
    });

    // 3️⃣ Process each inventory item
    const processedInventory = [];
    const invalidSuppliers = [];
    const skippedSuppliers = [];

    for (const item of inventory) {
      const supplierName = item?.supplierName?.trim();

      if (!supplierName) {
        invalidSuppliers.push({
          itemName: item.name || "(unnamed)",
          supplierName: "(empty/missing)",
        });
        continue;
      }

      const supplierId = supplierNameToId.get(supplierName.toLowerCase());

      if (supplierId) {
        // Ensure supplier still exists in DB (safety check)
        const exists = allSuppliers.find((s) => s.id === supplierId);
        if (!exists) {
          skippedSuppliers.push({
            itemName: item.name,
            supplierName,
            reason: `Supplier ID ${supplierId} not found in DB`,
          });
          continue;
        }

        const { supplierName: _, ...restItem } = item;
        processedInventory.push({
          ...restItem,
          supplierId,
        });
      } else {
        skippedSuppliers.push({
          itemName: item.name,
          supplierName,
          reason: "Supplier not found in DB",
        });
      }
    }

    // 4️⃣ Deduplicate by name
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
    // 5️⃣ Filter out existing inventory names
    const existing = await Inventory.findAll({ attributes: ["name"], raw: true });
    const existingNames = new Set(existing.map((e) => e.name.toLowerCase().trim()));
    console.log("existingNames", existingNames);
    const toInsert = uniqueByName.filter(
      (item) => !existingNames.has(item.name.toLowerCase().trim())
    );

    console.log("toInsert", toInsert);

    // 6️⃣ Insert new inventory
    const created =
      toInsert.length > 0
        ? await Inventory.bulkCreate(toInsert, { returning: true })
        : [];

    // 7️⃣ Audit log
    await Audit.create({
      userId,
      action: "import",
      tableName: "inventory",
      newData: created.map((r) => (r.get ? r.get() : r)),
    });

    // 8️⃣ Prepare result
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