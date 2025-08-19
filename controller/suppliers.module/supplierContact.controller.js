import db from "../../models/index.js";
const { SupplierContacts, Audit } = db;


export const createSupplierContact = async (req, res) => {

    try {
        const supplierContact = await SupplierContacts.create(req.body);
        await Audit.create({ userId: req.body.userId, action: 'create', tableName: 'supplierContacts', newData: supplierContact.get() });
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
        await Audit.create({ userId: req.body.userId, action: 'update', tableName: 'supplierContacts', oldData: supplierContact.get(), newData: req.body });
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
        await Audit.create({ userId: req.body.userId, action: 'delete', tableName: 'supplierContacts', oldData: supplierContact.get() });
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