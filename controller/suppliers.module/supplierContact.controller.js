import db from "../../models/index.js";
const { SupplierContacts } = db;


export const createSupplierContact = async (req, res) => {

    try {
        const supplierContact = await SupplierContacts.create(req.body);
        res.status(201).json({
            message: "Supplier contact created successfully",
            data: supplierContact
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating supplier contact",
            error: error.message
        });
    }
}


export const getSupplierContacts = async (req, res) => {
    try {
        const supplierContacts = await SupplierContacts.findAll();
        res.status(200).json({
            message: "Supplier contacts fetched successfully",
            data: supplierContacts
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching supplier contacts",
            error: error.message
        });
    }
}


export const updateSupplierContact = async (req, res) => {
    try {
        const supplierContact = await SupplierContacts.update(req.body, {
            where: { id: req.params.id }
        });
        res.status(200).json({
            message: "Supplier contact updated successfully",
            data: supplierContact
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating supplier contact",
            error: error.message
        });
    }
}


export const deleteSupplierContact = async (req, res) => {
    try {
        const supplierContact = await SupplierContacts.destroy({
            where: { id: req.params.id }
        });
        res.status(200).json({
            message: "Supplier contact deleted successfully",
            data: supplierContact
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting supplier contact",
            error: error.message
        });
    }
}