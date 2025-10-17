import express from "express";
import { createClient, getClients, updateClient, deleteClient, getClientById, statusUpdate, importCSV } from "../../controller/client/client.controller.js";

const clientRouter = express.Router();


clientRouter.post("/create", createClient);
clientRouter.post("/import", importCSV);
clientRouter.get("/get", getClients);
clientRouter.get("/get/:id", getClientById);
clientRouter.put("/update/:id", updateClient);
clientRouter.delete("/delete/:id", deleteClient);
clientRouter.put("/status/:id", statusUpdate);

export default clientRouter;