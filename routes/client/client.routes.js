import express from "express";
import { createClient, getClients, updateClient, deleteClient, getClientById, statusUpdate, importCSV } from "../../controller/client/client.controller.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";

const clientRouter = express.Router();


clientRouter.post("/create", authMiddleware, createClient);
clientRouter.post("/import", authMiddleware, importCSV);
clientRouter.get("/get", getClients);
clientRouter.get("/get/:id", getClientById);
clientRouter.put("/update/:id", authMiddleware, updateClient);
clientRouter.delete("/delete/:id", authMiddleware, deleteClient);
clientRouter.put("/status/:id", authMiddleware, statusUpdate);

export default clientRouter;