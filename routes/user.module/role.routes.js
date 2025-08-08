import express from 'express';
import { createRole, getRoles, updateRole, deleteRole } from '../../controller/user.module/role.controller.js';

const roleRouter = express.Router();


roleRouter.post('/create', createRole);
roleRouter.get('/get', getRoles);
roleRouter.put('/update/:id', updateRole);
roleRouter.delete('/delete/:id', deleteRole);

export default roleRouter;