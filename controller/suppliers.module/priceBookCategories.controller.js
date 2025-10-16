import db from '../../models/index.js';
const { PriceBookCategory, PriceBook } = db;
import { Op } from 'sequelize';


export const createPriceBookCategory = async (req, res) => {
    try {
        const { name, supplierId, version } = req.body;
        
        // Check if category with same name and version already exists for this supplier
        const existingCategory = await PriceBookCategory.findOne({
            where: {
                name: name,
                supplierId: supplierId,
                version: version || 'v1'
            }
        });

        if (existingCategory) {
            return res.status(400).json({ 
                error: `Category "${name}" already exists in version ${version || 'v1'}` 
            });
        }

        const priceBookCategory = await PriceBookCategory.create(req.body);
        res.status(201).json(priceBookCategory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getPriceBookCategories = async (req, res) => {
    const { search } = req.query;
    const whereClause = {};
    
    if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { version: { [Op.like]: `%${search}%` } }
        ];
    }

    whereClause.supplierId = req.params.id;
    try {
        const priceBookCategories = await PriceBookCategory.findAll({ where: whereClause });
        res.status(200).json(priceBookCategories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}





export const updatePriceBookCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { name, supplierId, version, ...otherData } = req.body;

        // Check if another category with same name and version already exists for this supplier
        if (name && supplierId && version) {
            const existingCategory = await PriceBookCategory.findOne({
                where: {
                    name: name,
                    supplierId: supplierId,
                    version: version
                }
            });

            // If exists and it's not the current category being updated
            if (existingCategory && existingCategory.id !== parseInt(categoryId)) {
                return res.status(400).json({ 
                    error: `Category "${name}" already exists in version ${version}` 
                });
            }
        }

        // Update the category
        await PriceBookCategory.update(req.body, { where: { id: categoryId } });

        // If version is being updated, also update all associated PriceBook items
        if (version) {
            await PriceBook.update(
                { version: version },
                { where: { priceBookCategoryId: categoryId } }
            );
        }

        res.status(200).json({ 
            message: 'Category and associated items updated successfully',
            updated: true 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const deletePriceBookCategory = async (req, res) => {
    try {
        const priceBookCategory = await PriceBookCategory.destroy({ where: { id: req.params.id } });
        res.status(200).json(priceBookCategory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getAvailableVersions = async (req, res) => {
    try {
        const { supplierId } = req.params;
        
        // Get distinct versions from both PriceBookCategory and PriceBook
        const categoryVersions = await PriceBookCategory.findAll({
            where: { supplierId },
            attributes: ['version'],
            group: ['version'],
            raw: true
        });

        // Extract unique versions and sort them
        const versions = [...new Set(categoryVersions.map(item => item.version))].sort();
        
        res.status(200).json({ versions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}