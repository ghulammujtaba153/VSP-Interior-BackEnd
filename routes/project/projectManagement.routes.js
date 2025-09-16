import express from "express";
import { createProjectManagement, deleteProjectManagement, getProjectManagements, updateProjectManagement } from "../../controller/project/projectManagement.controller.js";

const projectManagementRouter = express.Router();



projectManagementRouter.post("/create", createProjectManagement);

projectManagementRouter.get("/get/:id", getProjectManagements);

projectManagementRouter.put("/update/:id", updateProjectManagement);
projectManagementRouter.delete("/delete/:id", deleteProjectManagement);


export default projectManagementRouter;