import express from "express";
import {
  createInventoryCategory,
  getAllInventoryCategories,
  getInventoryCategoryById,
  updateInventoryCategory,
  deleteInventoryCategory,
} from "../../controller/inventory/inventoryCategory.controller.js";

const inventoryCategoryRouter = express.Router();

inventoryCategoryRouter.post("/create", createInventoryCategory);
inventoryCategoryRouter.get("/get", getAllInventoryCategories);
inventoryCategoryRouter.get("/get/:id", getInventoryCategoryById);
inventoryCategoryRouter.put("/update/:id", updateInventoryCategory);
inventoryCategoryRouter.delete("/delete/:id", deleteInventoryCategory);

export default inventoryCategoryRouter;
