import express from "express";
import { createSupplier, getSuppliers, getSupplierById, updateSupplier, deleteSupplier, importCSV } from "../../controller/suppliers.module/suppliers.controller.js";

const suppliersRouter = express.Router();

suppliersRouter.post("/create", createSupplier);
suppliersRouter.post("/import", importCSV);
suppliersRouter.get("/get", getSuppliers);
suppliersRouter.get("/get/:id", getSupplierById);
suppliersRouter.put("/update/:id", updateSupplier);
suppliersRouter.delete("/delete/:id", deleteSupplier);

export default suppliersRouter;