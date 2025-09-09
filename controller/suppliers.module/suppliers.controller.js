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
        // Get existing suppliers from DB
        const existingSuppliers = await Suppliers.findAll({ attributes: ["name"] });
        const existingNames = new Set(existingSuppliers.map(e => e.name));

        // Filter out duplicates
        const uniqueSuppliers = suppliers.filter(supplier => !existingNames.has(supplier.name));

        let insertedSuppliers = [];
        if (uniqueSuppliers.length > 0) {
            insertedSuppliers = await Suppliers.bulkCreate(uniqueSuppliers.map(row => ({ ...row })));

            // Audit log only when new suppliers are added
            await Audit.create({ 
                userId, 
                action: 'import', 
                tableName: 'suppliers', 
                newData: insertedSuppliers 
            });
        }

        res.status(201).json({
  message:
    "processed successfully, added: " +
    insertedSuppliers.length +
    ", skipped: " +
    (suppliers.length - insertedSuppliers.length),
  inserted: insertedSuppliers.length,
  skipped: suppliers.length - insertedSuppliers.length,
});

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



export const getSuppliers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        // Build search conditions
        const whereConditions = {};
        if (search && search.trim() !== '') {
            whereConditions[db.Sequelize.Op.or] = [
                { name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
                { email: { [db.Sequelize.Op.iLike]: `%${search}%` } },
                { phone: { [db.Sequelize.Op.iLike]: `%${search}%` } },
                { address: { [db.Sequelize.Op.iLike]: `%${search}%` } },
                { postCode: { [db.Sequelize.Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows: suppliers } = await Suppliers.findAndCountAll({
            where: whereConditions,
            include: [
                {
                    model: SupplierContacts,
                    as: 'contacts'
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: "Suppliers fetched successfully",
            data: suppliers,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: parseInt(limit),
                searchTerm: search
            }
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
