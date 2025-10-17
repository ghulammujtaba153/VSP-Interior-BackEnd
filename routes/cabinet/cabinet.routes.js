import express from 'express';
import { createCabinet, deleteCabinet, getCabinet, insertCabinet, updateCabinet } from '../../controller/cabinet/cabinet.controller.js';

const cabinetRouter = express.Router();

cabinetRouter.post("/create", createCabinet);
cabinetRouter.post("/import", insertCabinet); 
cabinetRouter.get("/get/:id", getCabinet);
cabinetRouter.put("/update/:id", updateCabinet);
cabinetRouter.delete("/delete/:id", deleteCabinet);

export default cabinetRouter