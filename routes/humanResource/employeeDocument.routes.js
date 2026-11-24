import express from 'express'
import {
  createEmployeeDocumentRequest,
  upload,
  deleteEmployeeDocumentRequest,
  getEmployeeDocumentRequestById,
  getEmployeeDocumentRequests,
  getEmployeeDocumentRequestsByEmployeeId,
  updateEmployeeDocumentRequest,
  uploadEmployeeDocument,
  updateEmployeeDocumentRequestStatus,
} from '../../controller/humanResource/employeeDocument.controller.js'
import { hrAdmin, hrAuth, hrSelfOrAdmin } from '../../middleware/hrRouteGuards.js'

const employeeDocumentRouter = express.Router()

employeeDocumentRouter.post('/create', ...hrAdmin, createEmployeeDocumentRequest)
employeeDocumentRouter.get('/get', ...hrAdmin, getEmployeeDocumentRequests)
employeeDocumentRouter.get('/get/:id', ...hrAuth, getEmployeeDocumentRequestById)
employeeDocumentRouter.get('/employee/:employeeId', ...hrSelfOrAdmin, getEmployeeDocumentRequestsByEmployeeId)
employeeDocumentRouter.put('/update/:id', ...hrAdmin, updateEmployeeDocumentRequest)
employeeDocumentRouter.delete('/delete/:id', ...hrAdmin, deleteEmployeeDocumentRequest)
employeeDocumentRouter.post('/upload', ...hrAuth, upload.single('file'), uploadEmployeeDocument)
employeeDocumentRouter.put('/update-status/:id', ...hrAdmin, updateEmployeeDocumentRequestStatus)

export default employeeDocumentRouter
