import express from "express";
import { createPriceBook, deletePriceBook, getPriceBook, importPriceBook, updatePriceBook } from "../../controller/suppliers.module/priceBook.controller.js";

const priceBookRouter = express.Router();


priceBookRouter.post("/create", createPriceBook);
priceBookRouter.post("/import", importPriceBook);
priceBookRouter.get("/get/:id", getPriceBook);
priceBookRouter.put("/update/:id", updatePriceBook);
priceBookRouter.delete("/delete/:id", deletePriceBook);


export default priceBookRouter;