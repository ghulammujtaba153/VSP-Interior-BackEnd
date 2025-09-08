import db from '../../models/index.js';
const { Contacts, Audit } = db;


export const createContact = async (req, res) => {
    try {
        const contact = await Contacts.create(req.body);
        await Audit.create({ userId: req.body.userId, action: 'create', tableName: 'contacts', newData: contact });
        res.status(201).json(contact);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export const importCSV = async (req, res) => {
    try {
        const { contacts, userId } = req.body;

        // Fetch existing contacts (phone + email)
        const existingContacts = await Contacts.findAll({
            attributes: ["phoneNumber", "emailAddress"]
        });

        const existingPhoneNumbers = new Set(existingContacts.map(e => e.phoneNumber));
        const existingEmailAddresses = new Set(existingContacts.map(e => e.emailAddress));

        // Filter out duplicates + validate required fields
        const uniqueContacts = contacts.filter(
            contact =>
                contact.phoneNumber &&
                contact.emailAddress &&
                !existingPhoneNumbers.has(contact.phoneNumber) &&
                !existingEmailAddresses.has(contact.emailAddress)
        );

        let insertedContacts = [];
        if (uniqueContacts.length > 0) {
            insertedContacts = await Contacts.bulkCreate(
                uniqueContacts.map(row => ({ ...row }))
            );

            // Audit log only if something new was added
            await Audit.create({
                userId,
                action: "import",
                tableName: "contacts",
                newData: insertedContacts
            });
        }

        res.status(201).json({
            message: "Contacts processed successfully",
            inserted: insertedContacts.length,
            skipped: contacts.length - insertedContacts.length,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



export const getContacts = async (req, res) => {
    try {
        const contacts = await Contacts.findAll();
        res.status(200).json(contacts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getContactByClient=  async(req, res)=>{
    try {
        const contacts = await Contacts.findAll({
            where: {
                clientId: req.params.clientId
            }
        });
        res.status(200).json(contacts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export const updateContact = async (req, res) => {
    try {
        const contact = await Contacts.update(req.body, {
            where: { id: req.params.id }
        });

        await Audit.create({ userId: req.body.userId, action: 'update', tableName: 'contacts', oldData: contact, newData: req.body });
        res.status(200).json(contact);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deleteContact = async (req, res) => {
    try {
        const contact = await Contacts.destroy({ where: { id: req.params.id } });
        await Audit.create({ userId: req.body.userId, action: 'delete', tableName: 'contacts', oldData: contact });
        res.status(200).json(contact);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}