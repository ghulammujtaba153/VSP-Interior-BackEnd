import db from '../../models/index.js';
const { Role } = db;

export const createRole = async (req, res) => {
    try {
        const { name } = req.body;
        console.log(name);
        const role = await Role.create({ name });
        res.status(201).json(role);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
}


export const getRoles = async (req, res) => {
    try {
        const roles = await Role.findAll();
        res.status(200).json(roles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}



export const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const role = await Role.findByPk(id);
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }
        role.name = name;
        await role.save();
        res.status(200).json(role);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        await Role.destroy({ where: { id } });
        res.status(200).json({ message: 'Role deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}