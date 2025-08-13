import express from 'express';
import { createCabinet, deleteCabinet, getCabinet, updateCabinet } from '../../controller/cabinet/cabinet.controller.js';

const cabinetRouter = express.Router();

cabinetRouter.post("/create", createCabinet);
cabinetRouter.get("/get", getCabinet);
cabinetRouter.put("/update/:id", updateCabinet);
cabinetRouter.delete("/delete/:id", deleteCabinet);

export default cabinetRouter