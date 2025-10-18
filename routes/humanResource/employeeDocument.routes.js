import express from 'express';
import {  createEmployeeDocumentRequest, upload, deleteEmployeeDocumentRequest,  getEmployeeDocumentRequestById, getEmployeeDocumentRequests, getEmployeeDocumentRequestsByEmployeeId, updateEmployeeDocumentRequest, uploadEmployeeDocument, updateEmployeeDocumentRequestStatus } from '../../controller/humanResource/employeeDocument.controller.js';


const employeeDocumentRouter = express.Router();

employeeDocumentRouter.post('/create', createEmployeeDocumentRequest);
employeeDocumentRouter.get('/get', getEmployeeDocumentRequests);
employeeDocumentRouter.get('/get/:id', getEmployeeDocumentRequestById);
employeeDocumentRouter.get('/employee/:employeeId', getEmployeeDocumentRequestsByEmployeeId);
employeeDocumentRouter.put('/update/:id', updateEmployeeDocumentRequest);
employeeDocumentRouter.delete('/delete/:id', deleteEmployeeDocumentRequest);
employeeDocumentRouter.post('/upload', upload.single("file"),  uploadEmployeeDocument);
employeeDocumentRouter.put('/update-status/:id',  updateEmployeeDocumentRequestStatus);

export default employeeDocumentRouter;