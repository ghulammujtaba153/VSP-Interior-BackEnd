import express from 'express';
import { createEmployeeTimeSheet, deleteEmployeeTimeSheet, employeeTimeSheetByEmployeeId, getEmployeeTimeSheet, getEmployeeTimeSheetById, updateEmployeeTimeSheet } from '../../controller/human-resource/employeeTimeSheet.controller.js';
// import { getEmployeeTimeSheetById } from './../../controller/human-resource/employeeTimeSheet.controller';

const employeeTimeSheetRouter = express.Router();

employeeTimeSheetRouter.post("/create", createEmployeeTimeSheet);
employeeTimeSheetRouter.get("/get", getEmployeeTimeSheet);
employeeTimeSheetRouter.get("/get/:id", getEmployeeTimeSheetById);
employeeTimeSheetRouter.get("/get/employee/:id", employeeTimeSheetByEmployeeId);
employeeTimeSheetRouter.delete("/delete/:id", deleteEmployeeTimeSheet);
employeeTimeSheetRouter.put("/update/:id", updateEmployeeTimeSheet);

export default employeeTimeSheetRouter