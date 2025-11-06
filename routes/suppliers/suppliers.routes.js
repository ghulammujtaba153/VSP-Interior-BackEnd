import express from "express";
import { createSupplier, getSuppliers, getSupplierById, updateSupplier, deleteSupplier, importCSV, getSupplierPerformanceReport } from "../../controller/suppliers/suppliers.controller.js";

const suppliersRouter = express.Router();

suppliersRouter.post("/create", createSupplier);
suppliersRouter.post("/import", importCSV);
suppliersRouter.get("/get", getSuppliers);
suppliersRouter.get("/get/:id", getSupplierById);
suppliersRouter.put("/update/:id", updateSupplier);
suppliersRouter.delete("/delete/:id", deleteSupplier);
suppliersRouter.get("/get/performance/stats", getSupplierPerformanceReport);

export default suppliersRouter;