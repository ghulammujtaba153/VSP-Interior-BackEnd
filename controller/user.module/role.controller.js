import db from '../../models/index.js';
const { Role, Audit } = db;

export const createRole = async (req, res) => {
    try {
        const { name } = req.body;
        console.log(name);
        const role = await Role.create({ name });
        await Audit.create({ userId: req.body.userId, action: 'create', tableName: 'roles', newData: role.get() });
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
        await Audit.create({ userId: req.body.userId, action: 'update', tableName: 'roles', oldData: role.get(), newData: req.body });
        res.status(200).json(role);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Role.findByPk(id);
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }
        await Role.destroy({ where: { id } });
        await Audit.create({ userId: req.body.userId, action: 'delete', tableName: 'roles', oldData: role.get() });
        res.status(200).json({ message: 'Role deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}