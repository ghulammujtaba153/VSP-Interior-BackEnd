import express from 'express';
import { createResource, getResources, deleteResource, updateResource } from '../../controller/user.module/resource.controller.js';

const resourceRouter = express.Router();


resourceRouter.post('/create', createResource);
resourceRouter.get('/get', getResources);
resourceRouter.delete('/delete/:id', deleteResource);
resourceRouter.put('/update/:id', updateResource);

export default resourceRouter;