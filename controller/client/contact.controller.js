import db from '../../models/index.js';
const { Contacts, Audit } = db;


export const createContact = async (req, res) => {
    try {
        const contact = await Contacts.create(req.body);
        await Audit.create({ userId: req.body.userId, action: 'create', tableName: 'contacts', newData: contact.get() });
        res.status(201).json(contact);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


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
        await Audit.create({ userId: req.body.userId, action: 'update', tableName: 'contacts', oldData: contact.get(), newData: req.body });
        res.status(200).json(contact);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}