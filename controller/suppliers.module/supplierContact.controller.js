import db from "../../models/index.js";
const { SupplierContacts, Audit } = db;


export const createSupplierContact = async (req, res) => {

    try {
        const supplierContact = await SupplierContacts.create(req.body);
        await Audit.create({ userId: req.body.userId, action: 'create', tableName: 'supplierContacts', newData: supplierContact});
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



export const importCSV = async (req, res) => {
    try {
        const { supplierContacts, userId } = req.body;

        // Validate rows before inserting
        for (const row of supplierContacts) {
            if (!row.phoneNumber || !row.emailAddress) {
                return res.status(400).json({ message: "phoneNumber and emailAddress are required" });
            }
        }

        const supplierContact = await SupplierContacts.bulkCreate(supplierContacts.map(row => ({ ...row })));
        await Audit.create({ userId, action: 'import', tableName: 'supplierContacts', newData: supplierContact });

        res.status(201).json(supplierContacts);
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        await Audit.create({ userId: req.body.userId, action: 'update', tableName: 'supplierContacts', oldData: supplierContact, newData: req.body });
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
        await Audit.create({ userId: req.body.userId, action: 'delete', tableName: 'supplierContacts', oldData: supplierContact });
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