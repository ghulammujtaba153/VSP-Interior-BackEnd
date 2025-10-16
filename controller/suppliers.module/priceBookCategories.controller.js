import db from '../../models/index.js';
const { PriceBookCategory, PriceBook } = db;
import { Op } from 'sequelize';


export const createPriceBookCategory = async (req, res) => {
    try {
        const { name, supplierId } = req.body;
        
        // Check if category with same name already exists for this supplier
        const existingCategory = await PriceBookCategory.findOne({
            where: {
                name: name,
                supplierId: supplierId
            }
        });

        if (existingCategory) {
            return res.status(400).json({ 
                error: `Category "${name}" already exists` 
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
          { name: { [Op.like]: `%${search}%` } }
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
        const { name, supplierId } = req.body;

        // Check if another category with same name already exists for this supplier
        if (name && supplierId) {
            const existingCategory = await PriceBookCategory.findOne({
                where: {
                    name: name,
                    supplierId: supplierId
                }
            });

            // If exists and it's not the current category being updated
            if (existingCategory && existingCategory.id !== parseInt(categoryId)) {
                return res.status(400).json({ 
                    error: `Category "${name}" already exists` 
                });
            }
        }

        // Update the category
        await PriceBookCategory.update(req.body, { where: { id: categoryId } });

        res.status(200).json({ 
            message: 'Category updated successfully',
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
        
        // Get distinct versions from PriceBook items for categories of this supplier
        const categories = await PriceBookCategory.findAll({
            where: { supplierId },
            attributes: ['id']
        });
        
        const categoryIds = categories.map(c => c.id);
        
        if (categoryIds.length === 0) {
            return res.status(200).json({ versions: ['v1'] });
        }
        
        const priceBookVersions = await PriceBook.findAll({
            where: { priceBookCategoryId: categoryIds },
            attributes: ['version'],
            group: ['version'],
            raw: true
        });

        // Extract unique versions and sort them
        const versions = [...new Set(priceBookVersions.map(item => item.version).filter(Boolean))].sort();
        
        res.status(200).json({ versions: versions.length > 0 ? versions : ['v1'] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}