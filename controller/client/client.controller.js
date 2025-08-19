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

export const getClients = async (req, res) => {
    try {
        const clients = await Clients.findAll({
            include: [
                {
                    model: Contacts,
                    as: 'contacts', // 👈 use the alias from your association
                }
            ]
        });
        res.status(200).json(clients);
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