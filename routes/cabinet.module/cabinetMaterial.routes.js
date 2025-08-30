import express from "express"
import { createCabinetQuote, deleteCabinetQuote, getCabinetQuotes, updateCabinetQuote } from "../../controller/cabinet/cabinetQuote.controller.js";


const cabinetQuoteRouter = express.Router();


cabinetQuoteRouter.post("/create", createCabinetQuote);

cabinetQuoteRouter.put("/update/:id", updateCabinetQuote);

cabinetQuoteRouter.delete("/delete/:id", deleteCabinetQuote);

cabinetQuoteRouter.get("/get", getCabinetQuotes);


export default cabinetQuoteRouter;