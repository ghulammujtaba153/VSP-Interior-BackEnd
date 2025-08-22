import db from '../../models/index.js';
const { Suppliers, SupplierContacts, Audit } = db;


export const createSupplier = async (req, res) => {

    try {
        console.log(req.body);
        const supplier = await Suppliers.create(req.body);
        await Audit.create({ userId: req.body.userId, action: 'create', tableName: 'suppliers', newData: supplier.get() });
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


export const importCSV = async (req, res) => {
    const { userId, suppliers } = req.body;

    try {
        const supplier = await Suppliers.bulkCreate(suppliers.map(row => ({ ...row })));
        await Audit.create({ userId, action: 'import', tableName: 'suppliers', newData: supplier });
        res.status(201).json(suppliers);
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        // Find the existing supplier first
        const supplier = await Suppliers.findByPk(req.params.id);

        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        const oldData = supplier.get(); // save old data

        // Update supplier
        await supplier.update(req.body);

        // Create audit log
        await Audit.create({
            userId: req.body.userId,
            action: 'update',
            tableName: 'suppliers',
            oldData,
            newData: req.body
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
};



export const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Suppliers.findByPk(req.params.id);

        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        const oldData = supplier.get(); // save old data

        await supplier.destroy();

        await Audit.create({
            userId: req.body?.userId || null, 
            action: 'delete',
            tableName: 'suppliers',
            oldData
        });

        res.status(200).json({
            message: "Supplier deleted successfully",
            data: oldData
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting supplier",
            error: error.message
        });
    }
};
