import express from 'express';
import { createCabinet, deleteCabinet, getCabinet, insertCabinet, updateCabinet } from '../../controller/cabinet/cabinet.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const cabinetRouter = express.Router();

cabinetRouter.post("/create", authMiddleware, createCabinet);
cabinetRouter.post("/import", authMiddleware, insertCabinet); 
cabinetRouter.get("/get/:id", authMiddleware, getCabinet);
cabinetRouter.put("/update/:id", authMiddleware, updateCabinet);
cabinetRouter.delete("/delete/:id", authMiddleware, deleteCabinet);

export default cabinetRouter