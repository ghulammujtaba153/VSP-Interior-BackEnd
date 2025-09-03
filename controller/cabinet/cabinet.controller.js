import db from '../../models/index.js';
import { Sequelize } from 'sequelize';
const { Cabinet, Audit, CabinetCategories, CabinetSubCategories } = db;

export const createCabinet = async (req, res) => {
    try {
        console.log(req.body)
        const cabinet = await Cabinet.create(req.body);
        await Audit.create({ userId: req.body.userId, action: 'create', tableName: 'cabinet', newData: cabinet.get() });
        res.status(201).json({
            message: "Cabinet created successfully",
            cabinet
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}


export const insertCabinet = async (req, res) => {
    try {
        const cabinets = req.body.data;
        if (!Array.isArray(cabinets) || cabinets.length === 0) {
            return res.status(400).json({ message: "Invalid data format" });
            
        }

        const createdCabinets = await Cabinet.bulkCreate(cabinets);
        // await Audit.create({ userId: req.body.userId, action: 'create', tableName: 'cabinet', newData: createdCabinets.map(cabinet => cabinet.get()) });

        res.status(201).json({
            message: "Cabinets inserted successfully",
            cabinets: createdCabinets
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}



export const getCabinet = async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    const whereConditions = {};
    const {id} = req.params;
    whereConditions.cabinetCategoryId = id; // Filter by category ID

    if (search && search.trim() !== '') {
        whereConditions[db.Sequelize.Op.or] = [
            { code: { [db.Sequelize.Op.iLike]: `%${search}%` } },
            
            { description: { [db.Sequelize.Op.iLike]: `%${search}%` } },

            
        ];
    }

    try {
        const cabinet = await Cabinet.findAll({

            where: whereConditions,
            offset,
            limit,
            include: [
                {
                    model: CabinetCategories,
                    as: 'cabinetCategory'
                },
                {
                    model: CabinetSubCategories,
                    as: 'cabinetSubCategory'
                }
            ]
        });
        res.status(200).json({
            message: "Cabinets fetched successfully",
            cabinet
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}

export const updateCabinet = async (req, res) => {
    try {
        const cabinet = await Cabinet.findByPk(req.params.id);  
        if (!cabinet) {
            return res.status(404).json({ message: "Cabinet not found" });
        }
        await cabinet.update(req.body);
        await Audit.create({ userId: req.body.userId, action: 'update', tableName: 'cabinet', oldData: cabinet.get(), newData: req.body });
        res.status(200).json({ message: "Cabinet updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}


export const deleteCabinet = async (req, res) => {
    try {
        const cabinet = await Cabinet.findByPk(req.params.id);
        if (!cabinet) {
            return res.status(404).json({ message: "Cabinet not found" });
        }
        await cabinet.destroy();
        await Audit.create({ userId: req.body.userId, action: 'delete', tableName: 'cabinet', oldData: cabinet.get() });
        res.status(200).json({ message: "Cabinet deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}