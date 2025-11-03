import express from "express";
import { createProjectPurchase, deleteProjectPurchase, getAllProjectPurchases, getProjectPurchaseById, updateProjectPurchase } from "../../../controller/project/purchase/purchase.controller.js";
import { upload } from "../../../controller/project/purchase/purchase.controller.js";


const purchaseRouter = express.Router();

purchaseRouter.post("/create", upload.array("files"), createProjectPurchase);
purchaseRouter.get("/get/:id", getProjectPurchaseById);
purchaseRouter.get("/get", getAllProjectPurchases);
purchaseRouter.put("/update/:id", upload.array("files"), updateProjectPurchase);
purchaseRouter.delete("/delete/:id", deleteProjectPurchase);

export default purchaseRouter;
