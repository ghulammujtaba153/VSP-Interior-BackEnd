import express from "express";
import { createProjectVariation, deleteProjectVariation, getAllProjectVariation, getProjectVariationById } from "../../controller/project/projectVariation.Controller.js";


const projectVariationRouter = express.Router();


projectVariationRouter.post("/create", createProjectVariation)

projectVariationRouter.get("/get", getAllProjectVariation)

projectVariationRouter.get("/get/:id", getProjectVariationById)

projectVariationRouter.delete("/delete/:id", deleteProjectVariation)

export default projectVariationRouter