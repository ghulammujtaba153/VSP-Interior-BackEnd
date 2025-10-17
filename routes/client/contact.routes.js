import express from "express";
import { createContact, getContacts, getContactByClient, updateContact, deleteContact, importCSV } from "../../controller/client/contact.controller.js";

const contactRouter = express.Router();

contactRouter.post("/create", createContact);
contactRouter.post("/import", importCSV);


contactRouter.get("/get", getContacts);

contactRouter.get("/get/:clientId", getContactByClient);

contactRouter.put("/update/:id", updateContact);

contactRouter.delete("/delete/:id", deleteContact);

export default contactRouter;