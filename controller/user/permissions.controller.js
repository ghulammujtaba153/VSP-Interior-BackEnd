import db from '../../models/index.js';
const { Permission, Resource, Role } = db;


export const createPermission = async (req, res) => {
    try {
        
        const permission = await Permission.create(req.body);
        res.status(201).json(permission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}



export const getPermissions = async (req, res) => {
    try {
        const permissions = await Permission.findAll({ order: [['createdAt', 'DESC']] });

        res.status(200).json(permissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getPermission = async (req, res) => {
    try {
        const { id } = req.params;
        const permission = await Permission.findByPk(id);
        res.status(200).json(permission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}



export const updatePermission = async (req, res) => {
    try {
        const { id } = req.params;
       
        const permission = await Permission.findByPk(id);
        if (!permission) {
            return res.status(404).json({ error: 'Permission not found' });
        }
        permission.set(req.body);
        await permission.save();
        res.status(200).json(permission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}



export const deletePermission = async (req, res) => {
    try {
        const { id } = req.params;
        await Permission.destroy({ where: { id } });
        res.status(200).json({ message: 'Permission deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getPermissionsByRole = async (req, res) => {
    try {
        const { roleId } = req.params;
        
        // First, get the role details
        const role = await Role.findByPk(roleId);
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        // Get all resources
        const resources = await Resource.findAll();
        
        // Get existing permissions for this role
        const existingPermissions = await Permission.findAll({
            where: { roleId },
            include: [{
                model: Resource,
                attributes: ['id', 'name']
            }]
        });

        // Create a map of existing permissions by resourceId
        const permissionMap = {};
        existingPermissions.forEach(perm => {
            permissionMap[perm.resourceId] = {
                id: perm.id,
                canCreate: perm.canCreate,
                canView: perm.canView,
                canEdit: perm.canEdit,
                canDelete: perm.canDelete,
                resource: perm.Resource.name
            };
        });

        // Create the complete list with all resources
        const allPermissions = resources.map(resource => {
            if (permissionMap[resource.id]) {
                return permissionMap[resource.id];
            } else {
                // Return default permissions (false) for resources without existing permissions
                return {
                    id: null, // No permission record exists yet
                    resourceId: resource.id,
                    roleId: parseInt(roleId),
                    canCreate: false,
                    canView: false,
                    canEdit: false,
                    canDelete: false,
                    resource: resource.name
                };
            }
        });

        res.status(200).json({
            role: role.name,
            permissions: allPermissions
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const createOrUpdatePermission = async (req, res) => {
    try {
        const { roleId, resourceId, canCreate, canView, canEdit, canDelete } = req.body;
        
        // Check if permission already exists
        const existingPermission = await Permission.findOne({
            where: { roleId, resourceId }
        });

        if (existingPermission) {
            // Update existing permission
            existingPermission.canCreate = canCreate;
            existingPermission.canView = canView;
            existingPermission.canEdit = canEdit;
            existingPermission.canDelete = canDelete;
            await existingPermission.save();
            res.status(200).json(existingPermission);
        } else {
            // Create new permission
            const newPermission = await Permission.create({
                roleId,
                resourceId,
                canCreate,
                canView,
                canEdit,
                canDelete
            });
            res.status(201).json(newPermission);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}