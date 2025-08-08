import express from "express";
import { createContact, getContacts, getContactByClient, updateContact } from "../../controller/client/contact.controller.js";

const contactRouter = express.Router();

contactRouter.post("/create", createContact);

contactRouter.get("/get", getContacts);

contactRouter.get("/get/:clientId", getContactByClient);

contactRouter.put("/update/:id", updateContact);

export default contactRouter;