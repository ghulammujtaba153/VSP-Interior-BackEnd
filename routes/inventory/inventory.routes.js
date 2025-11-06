import express from "express";
import { createInventory, getInventory, updateInventory, deleteInventory, importCSV, getInventoryPerformanceReport } from "../../controller/inventory/inventory.controller.js";

const inventoryRouter = express.Router();


inventoryRouter.post("/create", createInventory);
inventoryRouter.post("/import", importCSV);
inventoryRouter.get("/get", getInventory);
inventoryRouter.get("/get/performance/stats", getInventoryPerformanceReport);
inventoryRouter.put("/update/:id", updateInventory);
inventoryRouter.delete("/delete/:id", deleteInventory);

export default inventoryRouter;