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

        // Fetch existing clients (companyName + emailAddress)
        const existingClients = await Clients.findAll({
            attributes: ["id", "companyName", "emailAddress"]
        });

        const existingCompanyNames = new Set(existingClients.map(e => e.companyName));
        const existingEmailAddresses = new Set(existingClients.map(e => e.emailAddress));

        // Filter out duplicates + validate required fields
        const uniqueClients = clients.filter(
            client =>
                client.companyName &&
                client.emailAddress &&
                !existingCompanyNames.has(client.companyName) &&
                !existingEmailAddresses.has(client.emailAddress)
        );

        let insertedClients = [];
        let totalContactsInserted = 0;
        
        if (uniqueClients.length > 0) {
            // Insert clients first
            insertedClients = await Clients.bulkCreate(
                uniqueClients.map(row => {
                    const { contacts, ...clientData } = row;
                    return clientData;
                })
            );

            // Now insert contacts for each client
            for (let i = 0; i < insertedClients.length; i++) {
                const client = insertedClients[i];
                const clientData = uniqueClients[i];
                
                if (clientData.contacts && Array.isArray(clientData.contacts) && clientData.contacts.length > 0) {
                    // Add clientId to each contact
                    const contactsWithClientId = clientData.contacts.map(contact => ({
                        ...contact,
                        clientId: client.id
                    }));
                    
                    // Insert contacts for this client
                    const insertedContacts = await Contacts.bulkCreate(contactsWithClientId);
                    totalContactsInserted += insertedContacts.length;
                }
            }

            // Audit log only if something new was added
            await Audit.create({
                userId,
                action: "import",
                tableName: "clients",
                newData: {
                    clients: insertedClients,
                    contactsCount: totalContactsInserted
                }
            });
        }

        res.status(201).json({
            message: `Successfully imported ${insertedClients.length} clients with ${totalContactsInserted} contacts. Skipped ${clients.length - insertedClients.length} duplicates.`,
            inserted: insertedClients.length,
            contactsInserted: totalContactsInserted,
            skipped: clients.length - insertedClients.length,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getClients = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        // Build search conditions
        const whereConditions = {};
        if (search && search.trim() !== '') {
            whereConditions[db.Sequelize.Op.or] = [
                { companyName: { [db.Sequelize.Op.iLike]: `%${search}%` } },
                { emailAddress: { [db.Sequelize.Op.iLike]: `%${search}%` } },
                { phoneNumber: { [db.Sequelize.Op.iLike]: `%${search}%` } },
                { address: { [db.Sequelize.Op.iLike]: `%${search}%` } },
                { postCode: { [db.Sequelize.Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows: clients } = await Clients.findAndCountAll({
            where: whereConditions,
            include: [
                {
                    model: Contacts,
                    as: 'contacts', // 👈 use the alias from your association
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']],
            distinct: true,
        });

        res.status(200).json({
            message: "Clients fetched successfully",
            data: clients,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: parseInt(limit),
                searchTerm: search
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