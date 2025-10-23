import express from "express";
import {
  createNote,
  deleteNote,
  getNotes,
  updateNote,
  uploadNotes,
} from "../../../controller/project/jobScheduling/notes.controller.js";

const noteRouter = express.Router();

noteRouter.post("/create", uploadNotes.array("files"), createNote);
noteRouter.get("/job/:projectId", getNotes);
noteRouter.put("/update/:id", uploadNotes.array("files"), updateNote);
noteRouter.delete("/delete/:id", deleteNote);

export default noteRouter;