import db from '../../models/index.js';
const { Suppliers, SupplierContacts } = db;


export const createSupplier = async (req, res) => {

    try {
        console.log(req.body);
        const supplier = await Suppliers.create(req.body);
        res.status(201).json({
            message: "Supplier created successfully",
            data: supplier
        }); 
    } catch (error) {
        res.status(500).json({
            message: "Error creating supplier",
            error: error.message
        });
    }
}


export const getSuppliers = async (req, res) => {

    try {
        const suppliers = await Suppliers.findAll({
            include: [
                {
                    model: SupplierContacts,
                    as: 'contacts'
                }
            ]
        });
        res.status(200).json({
            message: "Suppliers fetched successfully",
            data: suppliers
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching suppliers",
            error: error.message
        });
    }
}

export const getSupplierById = async (req, res) => {
    try {
        const supplier = await Suppliers.findByPk(req.params.id);
        res.status(200).json({
            message: "Supplier fetched successfully",
            data: supplier
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching supplier",
            error: error.message
        });
    }
}


export const updateSupplier = async (req, res) => {
    try {
        const supplier = await Suppliers.update(req.body, {
            where: { id: req.params.id }
        });
        res.status(200).json({
            message: "Supplier updated successfully",
            data: supplier
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating supplier",
            error: error.message
        });
    }
}


export const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Suppliers.destroy({
            where: { id: req.params.id }
        });
        res.status(200).json({
            message: "Supplier deleted successfully",
            data: supplier
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting supplier",
            error: error.message
        });
    }
}