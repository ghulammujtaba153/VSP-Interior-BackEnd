import express from "express";
import { createKanbanTask, deleteKanbanTask, getKanbanTasksByJob, updateKanbanTask, uploadFile, upload } from "../../../controller/project/jobScheduling/projectKanban.controller.js";

const projectKanbanRouter = express.Router();

projectKanbanRouter.post("/create", createKanbanTask);
projectKanbanRouter.get("/job/:projectSetupJobId", getKanbanTasksByJob);
projectKanbanRouter.put("/update/:id", updateKanbanTask);
projectKanbanRouter.delete("/delete/:id", deleteKanbanTask);
projectKanbanRouter.post("/upload", upload.single("file"), uploadFile);

export default projectKanbanRouter;