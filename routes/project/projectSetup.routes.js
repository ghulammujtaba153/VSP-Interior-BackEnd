import express from 'express';
import { createProjectSetup, deleteProjectSetup, getAllProjectSetups, getProjectAmend, getProjectSetupById, getSalesStats, getProjectSetupStats, updateProjectSetup, updateStatus, getFinancialReport, getJobPerformanceStats } from '../../controller/project/projectSetup.controller.js';


const projectSetupRouter = express.Router();


projectSetupRouter.post('/create', createProjectSetup)

projectSetupRouter.get('/get', getAllProjectSetups);
projectSetupRouter.get('/get/:id', getProjectSetupById);
projectSetupRouter.get('/get/amend/:id', getProjectAmend)
projectSetupRouter.put('/update/:id', updateProjectSetup);
projectSetupRouter.delete('/delete/:id', deleteProjectSetup);
projectSetupRouter.put('/update/status/:id', updateStatus);
projectSetupRouter.get('/get/sales/stats', getSalesStats);
projectSetupRouter.get('/get/financial/report', getFinancialReport);
projectSetupRouter.get('/get/job/performance/stats', getJobPerformanceStats);
projectSetupRouter.get('/get/stats/:id', getProjectSetupStats);

export default projectSetupRouter;