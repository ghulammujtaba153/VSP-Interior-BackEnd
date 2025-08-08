import db from '../../models/index.js';

const { Resource } = db;


export const createResource = async (req, res) => {
    try {
        const resource = await Resource.create(req.body);
        res.status(201).json(resource);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const getResources = async (req, res) => {
    try {
        const resources = await Resource.findAll();
        res.status(200).json(resources);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const deleteResource = async (req, res) => {
    try {
        const { id } = req.params;
        await Resource.destroy({ where: { id } });
        res.status(200).json({ message: 'Resource deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const updateResource = async (req, res) => {
    try {
        const { id } = req.params;
        const resource = await Resource.findByPk(id);
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        await resource.update(req.body);
        res.status(200).json(resource);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}