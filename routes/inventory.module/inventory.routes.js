import express from "express";
import { createInventory, getInventory, updateInventory, deleteInventory } from "../../controller/inventory.module/inventory.controller.js";

const inventoryRouter = express.Router();


inventoryRouter.post("/create", createInventory);
inventoryRouter.get("/get", getInventory);
inventoryRouter.put("/update/:id", updateInventory);
inventoryRouter.delete("/delete/:id", deleteInventory);

export default inventoryRouter;