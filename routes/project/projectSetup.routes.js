import express from 'express';
import { createProjectSetup, deleteProjectSetup, getAllProjectSetups, getProjectAmend, getProjectSetupById, updateProjectSetup } from '../../controller/project/projectSetup.controller.js';


const projectSetupRouter = express.Router();


projectSetupRouter.post('/create', createProjectSetup)

projectSetupRouter.get('/get', getAllProjectSetups);
projectSetupRouter.get('/get/:id', getProjectSetupById);
projectSetupRouter.get('/get/amend/:id', getProjectAmend)
projectSetupRouter.put('/update/:id', updateProjectSetup);
projectSetupRouter.delete('/delete/:id', deleteProjectSetup);

export default projectSetupRouter;