import db from '../../models/index.js';
const { Clients, Contacts, Audit } = db;

export const createClient = async (req, res) => {
   try {
    const client = await Clients.create(req.body);
    await Audit.create({ userId: req.body.userId, action: 'create', tableName: 'clients', newData: client.get() });
    res.status(201).json(client);
   } catch (error) {
    res.status(500).json({ message: error.message });
   }
}


export const importCSV = async (req, res) => {
    try {
        const { clients, userId } = req.body;

        // Validate rows before inserting
        for (const row of clients) {
            if (!row.companyName || !row.emailAddress) {
                return res.status(400).json({ message: "companyName and emailAddress are required" });
            }
        }

        const client = await Clients.bulkCreate(clients.map(row => ({ ...row })));
        await Audit.create({ userId, action: 'import', tableName: 'clients', newData: client });

        res.status(201).json(clients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getClients = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: clients } = await Clients.findAndCountAll({
            include: [
                {
                    model: Contacts,
                    as: 'contacts', // 👈 use the alias from your association
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: "Clients fetched successfully",
            data: clients,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export const updateClient = async (req, res) => {

    try {
        const client = await Clients.findByPk(req.params.id);
        client.update(req.body);
        await Audit.create({ userId: req.body.userId, action: 'update', tableName: 'clients', oldData: client.get(), newData: req.body });
        res.status(200).json(client);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deleteClient = async (req, res) => {
    try {
        const client = await Clients.findByPk(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        await Clients.destroy({ where: { id: req.params.id } });
        await Audit.create({ userId: req.body.userId, action: 'delete', tableName: 'clients', oldData: client.get() });
        res.status(200).json({ message: "Client deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getClientById = async (req, res) => {
    try {
        const client = await Clients.findByPk(req.params.id, {
            include: [
                {
                    model: Contacts,
                    as: 'contacts',
                }
            ]
        });
        res.status(200).json(client);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export const statusUpdate = async (req, res) => {
    try {
        const client = await Clients.findByPk(req.params.id);
        client.update({ accountStatus: req.body.status });
        await Audit.create({ userId: req.body.userId, action: 'update', tableName: 'clients', oldData: client.get(), newData: req.body });
        res.status(200).json(client);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}