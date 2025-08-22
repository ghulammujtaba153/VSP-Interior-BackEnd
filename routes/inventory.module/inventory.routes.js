import express from "express";
import { createInventory, getInventory, updateInventory, deleteInventory, importCSV } from "../../controller/inventory.module/inventory.controller.js";

const inventoryRouter = express.Router();


inventoryRouter.post("/create", createInventory);
inventoryRouter.post("/import", importCSV);
inventoryRouter.get("/get", getInventory);
inventoryRouter.put("/update/:id", updateInventory);
inventoryRouter.delete("/delete/:id", deleteInventory);

export default inventoryRouter;