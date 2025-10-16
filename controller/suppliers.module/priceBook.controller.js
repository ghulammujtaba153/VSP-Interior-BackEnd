import db from '../../models/index.js';
const { PriceBook, PriceBookCategory, Suppliers } = db;


export const createPriceBook = async (req, res) => {
    try {
        const { priceBookCategoryId, ...otherData } = req.body;
        
        // Fetch the category to get its version
        const category = await PriceBookCategory.findByPk(priceBookCategoryId);
        
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        // Create price book item with the same version as the category
        const priceBook = await PriceBook.create({
            ...req.body,
            version: req.body.version || category.version // Use provided version or category's version
        });
        
        res.status(201).json(priceBook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const importPriceBook = async (req, res) => {
    try {
        const { userId, supplierId, items, version } = req.body;
        if (!Array.isArray(items) || items.length === 0 || !supplierId) {
            return res.status(400).json({ message: 'Invalid data format' });
        }

        const targetVersion = version || 'v1';

        // 1) Ensure categories exist (per supplier and version)
        const categoryNames = Array.from(new Set(items.map(i => i.category).filter(Boolean)));

        // Fetch existing categories for this supplier and version
        const existingCategories = await PriceBookCategory.findAll({
            where: { supplierId, version: targetVersion },
            attributes: ['id', 'name', 'version']
        });
        const nameToId = new Map(existingCategories.map(c => [c.name, c.id]));

        // Determine which categories need to be created
        const toCreate = categoryNames
            .filter(name => !nameToId.has(name))
            .map(name => ({ name, supplierId, version: targetVersion }));
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

        // 3) Fetch existing price book item names for these categories
        const categoryIds = Array.from(new Set(uniqueItems.map(i => nameToId.get(i.category)).filter(Boolean)));
        const existingItems = await PriceBook.findAll({
            where: { priceBookCategoryId: categoryIds, version: targetVersion },
            attributes: ['name', 'priceBookCategoryId', 'version']
        });
        const existsKey = new Set(existingItems.map(i => `${i.priceBookCategoryId}::${i.name}`));

        // 4) Prepare new rows (skip duplicates)
        const rowsToInsert = uniqueItems
            .map(i => ({
                priceBookCategoryId: nameToId.get(i.category),
                name: i.name,
                description: i.description || null,
                unit: i.unit,
                price: i.price,
                status: i.status === 'inactive' ? 'inactive' : 'active',
                version: targetVersion
            }))
            .filter(r => r.priceBookCategoryId && !existsKey.has(`${r.priceBookCategoryId}::${r.name}`));

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
            include: [{ model: PriceBookCategory,
                include: [
            {
              model: Suppliers,
              attributes: ["id", "name", "email", "phone"],
            },
          ],
             }]
        });
        res.status(200).json(priceBook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const updatePriceBook = async (req, res) => {
    try {
        const { priceBookCategoryId, ...updateData } = req.body;
        
        // If category is being changed, ensure version matches the new category
        if (priceBookCategoryId) {
            const category = await PriceBookCategory.findByPk(priceBookCategoryId);
            if (category) {
                updateData.version = category.version;
            }
        }
        
        const priceBook = await PriceBook.update(
            { ...updateData, priceBookCategoryId },
            { where: { id: req.params.id } }
        );
        
        res.status(200).json(priceBook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


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