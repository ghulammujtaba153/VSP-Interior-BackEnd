import db from '../../models/index.js';
const { PriceBookCategory } = db;


export const createPriceBookCategory = async (req, res) => {
    try {
        const priceBookCategory = await PriceBookCategory.create(req.body);
        res.status(201).json(priceBookCategory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getPriceBookCategories = async (req, res) => {
    try {
        const priceBookCategories = await PriceBookCategory.findAll({ where: { supplierId: req.params.id } });
        res.status(200).json(priceBookCategories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const updatePriceBookCategory = async (req, res) => {
    try {
        const priceBookCategory = await PriceBookCategory.update(req.body, { where: { id: req.params.id } });
        res.status(200).json(priceBookCategory);
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