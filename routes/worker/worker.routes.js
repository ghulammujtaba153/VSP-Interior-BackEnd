import express from 'express'
import { createWorker, deleteWorker, getAllWorkers, getWorkerById, importCSV, updateWorker, getWorkerStats } from '../../controller/worker/worker.controller.js';


const workerRouter = express.Router();

workerRouter.post('/create', createWorker);

workerRouter.post('/import', importCSV);

workerRouter.get('/get', getAllWorkers);

workerRouter.get('/get/stats', getWorkerStats); // Must come before /get/:id to avoid route conflict

workerRouter.get('/get/:id', getWorkerById);

workerRouter.put('/update/:id', updateWorker);

workerRouter.delete('/delete/:id', deleteWorker);

export default workerRouter;
