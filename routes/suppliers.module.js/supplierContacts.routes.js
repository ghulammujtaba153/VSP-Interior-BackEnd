import express from "express";
import { createSupplierContact, getSupplierContacts, updateSupplierContact, deleteSupplierContact, importCSV } from "../../controller/suppliers.module/supplierContact.controller.js";

const supplierContactsRouter = express.Router();

supplierContactsRouter.post("/create", createSupplierContact);
supplierContactsRouter.post("/import", importCSV);
supplierContactsRouter.get("/get", getSupplierContacts);
supplierContactsRouter.put("/update/:id", updateSupplierContact);
supplierContactsRouter.delete("/delete/:id", deleteSupplierContact);

export default supplierContactsRouter;