import express from "express";
import { createJobScheduling, deleteJobScheduling, getJobScheduling, getJobSchedulings, getJobsofWorker, updateJobScheduling } from "../../../controller/project/jobScheduling/jobScheduling.controller.js";


const jobSchedulingRouter = express.Router();

jobSchedulingRouter.post("/create", createJobScheduling);
jobSchedulingRouter.get("/get", getJobSchedulings);
jobSchedulingRouter.get("/get/:id", getJobScheduling);

jobSchedulingRouter.put("/update/:id", updateJobScheduling);
jobSchedulingRouter.get("/worker/:workerId", getJobsofWorker);
jobSchedulingRouter.delete("/delete/:id", deleteJobScheduling);

export default jobSchedulingRouter;
