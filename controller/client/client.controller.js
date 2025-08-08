import db from '../../models/index.js';
const { Clients, Contacts } = db;

export const createClient = async (req, res) => {
   try {
    const client = await Clients.create(req.body);
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
        res.status(200).json(client);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deleteClient = async (req, res) => {
    try {
        await Clients.destroy({ where: { id: req.params.id } });
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
        res.status(200).json(client);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}