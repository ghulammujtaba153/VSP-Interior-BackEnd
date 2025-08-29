import db from '../../models/index.js';
const { CabinetSubCategories, CabinetCategories } = db;


export const createCabinetSubCategory = async (req, res) => {
    try {
        const cabinetSubCategory = await CabinetSubCategories.create(req.body);
        res.status(201).json(cabinetSubCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export const getCabinetSubCategories = async (req, res) => {
    try {
        const cabinetSubCategories = await CabinetSubCategories.findAll({ where: { categoryId: req.params.id } });
        res.status(200).json(cabinetSubCategories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export const updateCabinetSubCategory = async (req, res) => {
    try {
        const cabinetSubCategory = await CabinetSubCategories.update(req.body, { where: { id: req.params.id } });
        res.status(200).json(cabinetSubCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export const deleteCabinetSubCategory = async (req, res) => {
    try {
        const cabinetSubCategory = await CabinetSubCategories.destroy({ where: { id: req.params.id } });
        res.status(200).json(cabinetSubCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
