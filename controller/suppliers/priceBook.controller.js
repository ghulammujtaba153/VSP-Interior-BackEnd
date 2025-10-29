import db from '../../models/index.js';
import { Op } from "sequelize";

const { PriceBook, PriceBookCategory, Suppliers } = db;



export const createPriceBook = async (req, res) => {
  try {
    const { priceBookCategoryId, name, version, supplierId } = req.body;

    // Validate required fields
    if (!supplierId) {
      return res.status(400).json({ error: "supplierId is required" });
    }

    // Verify category exists
    const category = await PriceBookCategory.findByPk(priceBookCategoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Verify supplier exists
    const supplier = await Suppliers.findByPk(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    const targetVersion = version || "v1";

    // Check for duplicate
    const existingItem = await PriceBook.findOne({
      where: {
        name,
        priceBookCategoryId,
        version: targetVersion,
      },
    });

    if (existingItem) {
      return res.status(400).json({
        error: `Item "${name}" already exists in version ${targetVersion}`,
      });
    }

    // ✅ Close previous versions
    if (version) {
      const now = new Date();
      await PriceBook.update(
        { versionEndDate: now, status: "inactive" },
        {
          where: {
            priceBookCategoryId,
            name,

            version: { [Op.ne]: version }, // mark all previous versions as ended
          },
        }
      );
    }

    // Create new version with supplierId
    const priceBook = await PriceBook.create({
      ...req.body,
      supplierId,
      version: targetVersion,
    });

    res.status(201).json(priceBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const importPriceBook = async (req, res) => {
    try {
        const { userId, supplierId, items, version } = req.body;
        if (!Array.isArray(items) || items.length === 0 || !supplierId) {
            return res.status(400).json({ message: 'Invalid data format. supplierId and items array are required.' });
        }

        const targetVersion = version || 'v1';

        // 1) Ensure categories exist (categories are now independent, no supplierId)
        const categoryNames = Array.from(new Set(items.map(i => i.category).filter(Boolean)));

        // Verify supplier exists
        const supplier = await Suppliers.findByPk(supplierId);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        // Fetch existing categories (categories are now independent, no supplier filter)
        const existingCategories = await PriceBookCategory.findAll({
            attributes: ['id', 'name']
        });
        const nameToId = new Map(existingCategories.map(c => [c.name, c.id]));

        // Determine which categories need to be created (without supplierId)
        const toCreate = categoryNames
            .filter(name => !nameToId.has(name))
            .map(name => ({ name })); // No supplierId in category
        const createdCategories = toCreate.length > 0
            ? await PriceBookCategory.bulkCreate(toCreate, { returning: true })
            : [];
        createdCategories.forEach(c => nameToId.set(c.name, c.id));

        // 2) Deduplicate items by name within the request
        const uniqueItems = [];
        const seenNames = new Set();
        for (const item of items) {
            const name = (item.name || '').trim();
            if (name && !seenNames.has(name)) {
                uniqueItems.push(item);
                seenNames.add(name);
            }
        }

        // 3) Fetch existing price book item names for these categories and version
        const categoryIds = Array.from(new Set(uniqueItems.map(i => nameToId.get(i.category)).filter(Boolean)));
        const existingItems = await PriceBook.findAll({
            where: { priceBookCategoryId: categoryIds, version: targetVersion },
            attributes: ['name', 'priceBookCategoryId', 'version']
        });
        const existsKey = new Set(existingItems.map(i => `${i.priceBookCategoryId}::${i.name}::${i.version}`));

        // 4) Prepare new rows (skip duplicates, include supplierId)
        const rowsToInsert = uniqueItems
            .map(i => ({
                supplierId, // Add supplierId to each pricebook item
                priceBookCategoryId: nameToId.get(i.category),
                name: i.name,
                description: i.description || null,
                unit: i.unit,
                price: i.price,
                status: i.status === 'inactive' ? 'inactive' : 'active',
                version: targetVersion
            }))
            .filter(r => r.priceBookCategoryId && !existsKey.has(`${r.priceBookCategoryId}::${r.name}::${r.version}`));

        const created = rowsToInsert.length > 0
            ? await PriceBook.bulkCreate(rowsToInsert, { returning: true })
            : [];

        return res.status(201).json({
            message: `PriceBook processed: inserted ${created.length} items in ${targetVersion}, skipped ${uniqueItems.length - created.length} duplicate(s).`,
            insertedCount: created.length,
            duplicateCount: uniqueItems.length - created.length,
            categoriesCreated: createdCategories.length,
            version: targetVersion,
            items: created
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}




export const getPriceBook = async (req, res) => {
    try {
        const priceBook = await PriceBook.findAll({
            where: {
                priceBookCategoryId: req.params.id
            },
            include: [
                { 
                    model: PriceBookCategory,
                    attributes: ["id", "name"]
                },
                {
                    model: Suppliers,
                    attributes: ["id", "name", "email", "phone"],
                }
            ]
        });
        res.status(200).json(priceBook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const updatePriceBook = async (req, res) => {
    try {
        const itemId = req.params.id;
        const { name, priceBookCategoryId, version, supplierId } = req.body;

        // Validate supplier exists if supplierId is provided
        if (supplierId) {
            const supplier = await Suppliers.findByPk(supplierId);
            if (!supplier) {
                return res.status(404).json({ error: 'Supplier not found' });
            }
        }

        if (name || priceBookCategoryId || version) {
            // Get current item
            const currentItem = await PriceBook.findByPk(itemId);
            
            if (!currentItem) {
                return res.status(404).json({ error: 'Item not found' });
            }

            // Build where clause for duplicate check
            const checkName = name || currentItem.name;
            const checkCategory = priceBookCategoryId || currentItem.priceBookCategoryId;
            const checkVersion = version || currentItem.version;


            // Check if another item exists with same name + category + version
            const existingItem = await PriceBook.findOne({
                where: {
                    name: checkName,
                    priceBookCategoryId: checkCategory,
                    version: checkVersion
                }
            });



            // If exists and it's not the current item being updated
            if (existingItem && existingItem.id !== parseInt(itemId)) {
                return res.status(400).json({ 
                    error: `Item "${checkName}" already exists in version ${checkVersion}` 
                });
            }
        }

        

        const priceBook = await PriceBook.update(req.body, {
            where: { id: itemId }
        });
        res.status(200).json(priceBook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const getPriceBookHistory = async (req, res) => {
  const { name, priceBookCategoryId } = req.query;
  console.log('Fetching history for:', name, priceBookCategoryId);

  try {
    const whereClause = {};

    if (name) whereClause.name = name;
    if (priceBookCategoryId) whereClause.priceBookCategoryId = priceBookCategoryId;

    const priceBooks = await PriceBook.findAll({
      where: whereClause,
      order: [['version', 'DESC']],
    });

    res.status(200).json(priceBooks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};





export const deletePriceBook = async (req, res) => {
    try {
        const priceBook = await PriceBook.destroy({
            where: { id: req.params.id }
        });
        res.status(200).json(priceBook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}