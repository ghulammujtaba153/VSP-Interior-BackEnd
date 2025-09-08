import db from '../../models/index.js';
const { PriceBook, PriceBookCategory } = db;


export const createPriceBook = async (req, res) => {
    try {
        const priceBook = await PriceBook.create(req.body);
        res.status(201).json(priceBook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const importPriceBook = async (req, res) => {
    try {
        const { userId, supplierId, items } = req.body;
        if (!Array.isArray(items) || items.length === 0 || !supplierId) {
            return res.status(400).json({ message: 'Invalid data format' });
        }

        // 1) Ensure categories exist (per supplier)
        const categoryNames = Array.from(new Set(items.map(i => i.category).filter(Boolean)));

        // Fetch existing categories for this supplier
        const existingCategories = await PriceBookCategory.findAll({
            where: { supplierId },
            attributes: ['id', 'name']
        });
        const nameToId = new Map(existingCategories.map(c => [c.name, c.id]));

        // Determine which categories need to be created
        const toCreate = categoryNames.filter(name => !nameToId.has(name)).map(name => ({ name, supplierId }));
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
            where: { priceBookCategoryId: categoryIds },
            attributes: ['name', 'priceBookCategoryId']
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
                status: i.status === 'inactive' ? 'inactive' : 'active'
            }))
            .filter(r => r.priceBookCategoryId && !existsKey.has(`${r.priceBookCategoryId}::${r.name}`));

        const created = rowsToInsert.length > 0
            ? await PriceBook.bulkCreate(rowsToInsert, { returning: true })
            : [];

        return res.status(201).json({
            message: `PriceBook processed: inserted ${created.length}, skipped ${uniqueItems.length - created.length} duplicate(s).`,
            insertedCount: created.length,
            duplicateCount: uniqueItems.length - created.length,
            categoriesCreated: createdCategories.length,
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
            
        });
        res.status(200).json(priceBook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const updatePriceBook = async (req, res) => {
    try {
        const priceBook = await PriceBook.update(req.body, {
            where: { id: req.params.id }
        });
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