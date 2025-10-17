import express from "express";
import { createPriceBook, deletePriceBook, getPriceBook, getPriceBookHistory, importPriceBook, updatePriceBook } from "../../controller/suppliers/priceBook.controller.js";

const priceBookRouter = express.Router();


priceBookRouter.post("/create", createPriceBook);
priceBookRouter.post("/import", importPriceBook);
priceBookRouter.get("/get/:id", getPriceBook);
priceBookRouter.get("/history", getPriceBookHistory);
priceBookRouter.put("/update/:id", updatePriceBook);
priceBookRouter.delete("/delete/:id", deletePriceBook);


export default priceBookRouter;