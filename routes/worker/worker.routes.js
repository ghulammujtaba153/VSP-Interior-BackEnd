import express from 'express'
import { createWorker, deleteWorker, getAllWorkers, getWorkerById, importCSV, updateWorker } from '../../controller/worker/worker.controller.js';


const workerRouter = express.Router();

workerRouter.post('/create', createWorker);

workerRouter.post('/import', importCSV);

workerRouter.get('/get', getAllWorkers);

workerRouter.get('/get/:id', getWorkerById);

workerRouter.put('/update/:id', updateWorker);

workerRouter.delete('/delete/:id', deleteWorker);

export default workerRouter;
