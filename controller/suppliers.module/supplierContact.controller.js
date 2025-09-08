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

        // Fetch existing contacts (phone + email)
        const existingSupplierContacts = await SupplierContacts.findAll({
            attributes: ["phoneNumber", "emailAddress"]
        });

        const existingPhoneNumbers = new Set(existingSupplierContacts.map(e => e.phoneNumber));
        const existingEmailAddresses = new Set(existingSupplierContacts.map(e => e.emailAddress));

        // Filter unique new contacts
        const uniqueSupplierContacts = supplierContacts.filter(
            contact =>
                contact.phoneNumber &&
                contact.emailAddress &&
                !existingPhoneNumbers.has(contact.phoneNumber) &&
                !existingEmailAddresses.has(contact.emailAddress)
        );

        let insertedContacts = [];
        if (uniqueSupplierContacts.length > 0) {
            insertedContacts = await SupplierContacts.bulkCreate(
                uniqueSupplierContacts.map(row => ({ ...row }))
            );

            // Audit log only if new rows inserted
            await Audit.create({
                userId,
                action: "import",
                tableName: "supplierContacts",
                newData: insertedContacts
            });
        }

        res.status(201).json({
            message: "Supplier contacts processed successfully",
            inserted: insertedContacts.length,
            skipped: supplierContacts.length - insertedContacts.length,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



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