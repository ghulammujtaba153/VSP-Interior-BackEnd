import db from '../../models/index.js';
import { Sequelize, Op } from "sequelize";
const {Inventory, Audit} = db;

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

        if (!Array.isArray(inventory) || inventory.length === 0) {
            return res.status(400).json({ message: "Invalid data format" });
        }

        // Deduplicate incoming records by name (keep first occurrence)
        const uniqueByName = [];
        const seen = new Set();
        for (const item of inventory) {
            const name = item?.name?.trim();
            if (name && !seen.has(name)) {
                uniqueByName.push(item);
                seen.add(name);
            }
        }

        // Fetch existing inventory names from DB
        const existing = await Inventory.findAll({ attributes: ["name"] });
        const existingNames = new Set(existing.map(e => e.name));

        // Filter out names that already exist
        const toInsert = uniqueByName.filter(item => !existingNames.has(item.name));

        // Insert only unique, non-existing items
        const created = toInsert.length > 0
            ? await Inventory.bulkCreate(toInsert, { returning: true })
            : [];

        // Audit
        await Audit.create({ userId, action: 'import', tableName: 'inventory', newData: created.map(r => r.get ? r.get() : r) });

        const insertedCount = created.length;
        const duplicateCount = inventory.length - insertedCount;

        return res.status(201).json({
            message: `Inventory processed: inserted ${insertedCount}, skipped ${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'}.`,
            insertedCount,
            duplicateCount,
            inventory: created,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}



export const getInventory = async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (page - 1) * limit;
  const whereConditions = {};

  if (search && search.trim() !== "") {
    whereConditions[Op.or] = [
      { itemCode: { [Op.iLike]: `%${search}%` } },
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },

      // ✅ Cast numeric fields to TEXT so iLike works
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
    const { rows, count } = await Inventory.findAndCountAll({
      include: [
        {
          model: db.Suppliers,
          as: "supplier",
        },
      ],
      where: whereConditions,
      offset,
      limit: parseInt(limit, 10),
    });

    res.status(200).json({
      message: "Inventory fetched successfully",
      inventory: rows,
      total: count, // ✅ send total for pagination
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