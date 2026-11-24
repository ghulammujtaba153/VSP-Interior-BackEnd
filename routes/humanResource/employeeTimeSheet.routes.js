import express from 'express'
import {
  createEmployeeTimeSheet,
  deleteEmployeeTimeSheet,
  employeeTimeSheetByEmployeeId,
  getEmployeeTimeSheet,
  getEmployeeTimeSheetById,
  updateEmployeeTimeSheet,
  submitEmployeeTimeSheet,
  approveEmployeeTimeSheet,
} from '../../controller/humanResource/employeeTimeSheet.controller.js'
import { hrAdmin, hrAuth, hrSelfOrAdminById } from '../../middleware/hrRouteGuards.js'

const employeeTimeSheetRouter = express.Router()

employeeTimeSheetRouter.post('/create', ...hrAuth, createEmployeeTimeSheet)
employeeTimeSheetRouter.get('/get', ...hrAuth, getEmployeeTimeSheet)
employeeTimeSheetRouter.get('/get/employee/:id', ...hrSelfOrAdminById, employeeTimeSheetByEmployeeId)
employeeTimeSheetRouter.get('/get/:id', ...hrAuth, getEmployeeTimeSheetById)
employeeTimeSheetRouter.put('/update/:id', ...hrAuth, updateEmployeeTimeSheet)
employeeTimeSheetRouter.post('/:id/submit', ...hrAuth, submitEmployeeTimeSheet)
employeeTimeSheetRouter.post('/:id/approve', ...hrAuth, approveEmployeeTimeSheet)
employeeTimeSheetRouter.delete('/delete/:id', ...hrAuth, deleteEmployeeTimeSheet)

export default employeeTimeSheetRouter
