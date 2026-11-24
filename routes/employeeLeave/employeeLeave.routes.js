import express from 'express'
import {
  createEmployeeLeave,
  deleteEmployeeLeave,
  getEmployeeLeaveByEmployeeId,
  getEmployeeLeaveById,
  getEmployeeLeaves,
  updateEmployeeLeave,
} from '../../controller/employeeLeave/employeeLeave.controller.js'
import { hrAdmin, hrAuth, hrSelfOrAdmin } from '../../middleware/hrRouteGuards.js'

const employeeRouter = express.Router()

employeeRouter.post('/create', ...hrAuth, createEmployeeLeave)
employeeRouter.get('/get', ...hrAuth, getEmployeeLeaves)
employeeRouter.get('/get/employee/:employeeId', ...hrSelfOrAdmin, getEmployeeLeaveByEmployeeId)
employeeRouter.get('/get/leave/:leaveId', ...hrAuth, getEmployeeLeaveById)
employeeRouter.put('/update/:id', ...hrAuth, updateEmployeeLeave)
employeeRouter.delete('/delete/:id', ...hrAuth, deleteEmployeeLeave)
employeeRouter.post('/delete', ...hrAuth, deleteEmployeeLeave)

export default employeeRouter
