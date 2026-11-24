import express from 'express'
import {
  getAllPayroll,
  createPayroll,
  updatePayroll,
  deletePayroll,
} from '../../controller/humanResource/payroll.controller.js'
import { hrAdmin, hrAuth } from '../../middleware/hrRouteGuards.js'

const router = express.Router()

router.get('/get', ...hrAdmin, getAllPayroll)
router.post('/create', ...hrAdmin, createPayroll)
router.put('/update/:id', ...hrAdmin, updatePayroll)
router.delete('/delete/:id', ...hrAdmin, deletePayroll)

export default router
