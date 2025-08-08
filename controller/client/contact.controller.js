import db from '../../models/index.js';
const { Contacts } = db;


export const createContact = async (req, res) => {
    try {
        const contact = await Contacts.create(req.body);
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
        res.status(200).json(contact);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}