import express from 'express';
import { createEmployeeLeave, deleteEmployeeLeave, getEmployeeLeaveByEmployeeId, getEmployeeLeaves, updateEmployeeLeave } from '../../controller/employeeLeave/employeeLeave.controller.js';


const employeeRouter = express.Router();

employeeRouter.post("/create", createEmployeeLeave)
employeeRouter.get("/get", getEmployeeLeaves);
employeeRouter.get("/get/:id", getEmployeeLeaveByEmployeeId);
employeeRouter.put("/update/:id", updateEmployeeLeave);
employeeRouter.post("/delete", deleteEmployeeLeave);

export default employeeRouter;