import express from 'express';
import { createPermission, deletePermission, getPermission, getPermissions, updatePermission, getPermissionsByRole, createOrUpdatePermission } from '../../controller/user/permissions.controller.js';



const permissionRouter = express.Router();


permissionRouter.post('/create', createPermission);
permissionRouter.get('/get', getPermissions);
permissionRouter.put('/update/:id', updatePermission);
permissionRouter.delete('/delete/:id', deletePermission);
permissionRouter.get('/get/:id', getPermission);
permissionRouter.get('/get/by-role/:roleId', getPermissionsByRole);
permissionRouter.post('/create-or-update', createOrUpdatePermission);


export default permissionRouter;