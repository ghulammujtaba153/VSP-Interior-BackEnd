import db from '../../models/index.js';
const { Cabinet } = db;

export const createCabinet = async (req, res) => {
    try {
        console.log(req.body)
        const cabinet = await Cabinet.create(req.body);
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


export const getCabinet = async (req, res) => {
    try {
        const cabinet = await Cabinet.findAll();
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
        res.status(200).json({ message: "Cabinet deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}