import express from 'express'
import {
  getEmploymentProfile,
  upsertEmploymentProfile,
  backfillWorkerUserLinks,
} from '../../controller/humanResource/employmentProfile.controller.js'
import {
  getLeavePolicies,
  getLeaveBalances,
  upsertLeavePolicy,
} from '../../controller/humanResource/leavePolicy.controller.js'
import {
  listPayPeriods,
  createPayPeriod,
  lockPayPeriod,
} from '../../controller/humanResource/payPeriod.controller.js'
import {
  listPayrollRuns,
  listPayslips,
  generatePayrollRun,
  updatePayrollRunStatus,
  getPayslip,
  getPayslipsByUser,
  getPayslipPdf,
} from '../../controller/humanResource/payrollRun.controller.js'
import {
  listCertifications,
  getExpiringCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
} from '../../controller/humanResource/certification.controller.js'
import {
  getHrDashboardReports,
  getTimesheetReconciliation,
  createPayrollJournalStub,
  getStaffStats,
} from '../../controller/humanResource/hrReports.controller.js'
import { getApprovalsQueue } from '../../controller/humanResource/approvals.controller.js'
import { getOnboardingDashboard } from '../../controller/humanResource/onboarding.controller.js'
import { hrAdmin, hrAuth, hrSelfOrAdmin, hrSelfOrAdminById, hrSelfOrAdminByUserId } from '../../middleware/hrRouteGuards.js'
import { requireManagerOrHr } from '../../middleware/hrPermissionMiddleware.js'

const router = express.Router()

router.get('/employees/:id/profile', ...hrSelfOrAdminById, getEmploymentProfile)
router.put('/employees/:id/profile', ...hrAdmin, upsertEmploymentProfile)
router.post('/workers/backfill-links', ...hrAdmin, backfillWorkerUserLinks)

router.get('/leave-policies', ...hrAuth, getLeavePolicies)
router.post('/leave-policies', ...hrAdmin, upsertLeavePolicy)
router.get('/leave-balances/:userId', ...hrSelfOrAdminByUserId, getLeaveBalances)

router.get('/pay-periods', ...hrAdmin, listPayPeriods)
router.post('/pay-periods', ...hrAdmin, createPayPeriod)
router.post('/pay-periods/:id/lock', ...hrAdmin, lockPayPeriod)

router.get('/payroll-runs', ...hrAdmin, listPayrollRuns)
router.post('/payroll-runs/generate', ...hrAdmin, generatePayrollRun)
router.put('/payroll-runs/:id/status', ...hrAdmin, updatePayrollRunStatus)
router.get('/payslips', ...hrAdmin, listPayslips)
router.get('/payslips/user/:userId', ...hrSelfOrAdminByUserId, getPayslipsByUser)
router.get('/payslips/:id/pdf', ...hrAuth, getPayslipPdf)
router.get('/payslips/:id', ...hrAuth, getPayslip)

router.get('/certifications', ...hrAuth, listCertifications)
router.get('/certifications/expiring', ...hrAdmin, getExpiringCertifications)
router.post('/certifications', ...hrAuth, createCertification)
router.put('/certifications/:id', ...hrAuth, updateCertification)
router.delete('/certifications/:id', ...hrAdmin, deleteCertification)

router.get('/reports/dashboard', ...hrAdmin, getHrDashboardReports)
router.get('/reports/timesheet-reconciliation', ...hrAdmin, getTimesheetReconciliation)
router.post('/reports/payroll-journal', ...hrAdmin, createPayrollJournalStub)
router.get('/staff-stats', ...hrAdmin, getStaffStats)

router.get('/approvals/queue', ...hrAuth, requireManagerOrHr(), getApprovalsQueue)
router.get('/onboarding', ...hrAdmin, getOnboardingDashboard)

export default router
