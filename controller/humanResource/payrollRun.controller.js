import db from '../../models/index.js'
import { Op } from 'sequelize'
import {
  buildPayslipTotals,
  parseTimeToHours,
} from '../../service/nzPayrollService.js'
import { logHrAudit } from '../../service/hrAuditService.js'

import { isHrAdmin } from '../../utils/permissionUtils.js'

const assertPayslipAccess = (req, payslip) => {
  if (isHrAdmin(req.authUser)) return true
  return payslip.userId === req.authUser.id
}

const {
  PayrollRun,
  Payslip,
  PayrollDeduction,
  PayPeriod,
  EmployeeTimeSheet,
  EmploymentProfile,
  User,
  Role,
} = db

const payslipWithUserInclude = {
  model: Payslip,
  as: 'payslips',
  include: [
    {
      model: User,
      as: 'user',
      attributes: ['id', 'name', 'email'],
      include: [{ model: Role, attributes: ['id', 'name'] }],
    },
  ],
}

export const listPayrollRuns = async (req, res) => {
  try {
    if (req.query.summary === 'true') {
      const runs = await PayrollRun.findAll({
        attributes: ['id', 'month', 'year', 'status', 'createdAt'],
        include: [{ model: Payslip, as: 'payslips', attributes: ['id'] }],
        order: [['createdAt', 'DESC']],
      })
      return res.json({ success: true, data: runs })
    }

    const runs = await PayrollRun.findAll({
      include: [payslipWithUserInclude],
      order: [['createdAt', 'DESC']],
    })
    return res.json({ success: true, data: runs })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

async function buildPayrollSummary(month, year) {
  if (!month || !year) {
    return { totalNetPay: 0, pendingPayroll: 0, paidRunCount: 0 }
  }

  const runs = await PayrollRun.findAll({
    where: { month, year: Number(year) },
    include: [{ model: Payslip, as: 'payslips', attributes: ['netPay'] }],
  })

  let totalNetPay = 0
  let pendingPayroll = 0
  let paidRunCount = 0

  for (const run of runs) {
    const runTotal = (run.payslips || []).reduce((s, p) => s + Number(p.netPay || 0), 0)
    totalNetPay += runTotal
    if (run.status === 'paid') paidRunCount += 1
    if (!['paid', 'locked'].includes(run.status)) pendingPayroll += runTotal
  }

  return { totalNetPay, pendingPayroll, paidRunCount }
}

export const listPayslips = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 5000)
    const offset = (page - 1) * limit
    const { month, year, search } = req.query

    const runWhere = {}
    if (month) runWhere.month = month
    if (year) runWhere.year = Number(year)

    const userInclude = {
      model: User,
      as: 'user',
      attributes: ['id', 'name', 'email'],
      include: [{ model: Role, attributes: ['id', 'name'] }],
    }

    if (search?.trim()) {
      userInclude.where = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ],
      }
      userInclude.required = true
    }

    const { count, rows } = await Payslip.findAndCountAll({
      include: [
        userInclude,
        {
          model: PayrollRun,
          as: 'payrollRun',
          where: Object.keys(runWhere).length ? runWhere : undefined,
          required: !!(month || year),
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    })

    const data = rows.map((p) => ({
      ...p.get({ plain: true }),
      runMonth: p.payrollRun?.month,
      runYear: p.payrollRun?.year,
      runStatus: p.payrollRun?.status,
      runId: p.payrollRun?.id,
    }))

    const summary = await buildPayrollSummary(month, year)

    return res.json({
      success: true,
      data,
      total: count,
      page,
      limit,
      summary,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const generatePayrollRun = async (req, res) => {
  try {
    const { month, year, payPeriodId } = req.body

    const run = await PayrollRun.create({
      month,
      year,
      payPeriodId: payPeriodId || null,
      status: 'draft',
    })

    const period = payPeriodId ? await PayPeriod.findByPk(payPeriodId) : null
    const timesheetWhere = { status: { [Op.in]: ['approved', 'locked'] } }

    if (period) {
      timesheetWhere.payPeriodId = period.id
    }

    const timesheets = await EmployeeTimeSheet.findAll({ where: timesheetWhere })
    const byEmployee = {}

    for (const ts of timesheets) {
      if (!byEmployee[ts.employeeId]) byEmployee[ts.employeeId] = []
      byEmployee[ts.employeeId].push(ts)
    }

    const payslips = []

    for (const [employeeId, rows] of Object.entries(byEmployee)) {
      const profile = await EmploymentProfile.findOne({
        where: { userId: employeeId },
      })
      const user = await User.findByPk(employeeId)

      const standardDay = Number(profile?.standardHoursPerDay || 8)
      let regularHours = 0
      let overtimeHours = 0

      for (const row of rows) {
        const hours = parseTimeToHours(row.startTime, row.endTime, row.breakMinutes || 0)
        if (hours > standardDay) {
          regularHours += standardDay
          overtimeHours += hours - standardDay
        } else {
          regularHours += hours
        }
      }

      const hourlyRate = Number(profile?.hourlyRate || 0)
      const monthlySalary = Number(profile?.annualSalary || user?.salary || 0) / 12
      const overtimePay = overtimeHours * hourlyRate * 1.5
      const basePay = hourlyRate > 0 ? regularHours * hourlyRate : monthlySalary

      const totals = buildPayslipTotals({
        basePay,
        overtimePay,
        taxCode: profile?.irdTaxCode || 'M',
        kiwiSaverEnrolled: profile?.kiwiSaverEnrolled,
        kiwiSaverRate: profile?.kiwiSaverRate,
        kiwiSaverEmployerRate: profile?.kiwiSaverEmployerRate,
      })

      const payslip = await Payslip.create({
        payrollRunId: run.id,
        userId: Number(employeeId),
        basePay,
        overtimePay,
        grossPay: totals.grossPay,
        payeTax: totals.payeTax,
        kiwiSaverEmployee: totals.kiwiSaverEmployee,
        kiwiSaverEmployer: totals.kiwiSaverEmployer,
        esct: totals.esct,
        netPay: totals.netPay,
        costCentre: profile?.costCentre || null,
      })

      if (totals.payeTax > 0) {
        await PayrollDeduction.create({
          payslipId: payslip.id,
          type: 'PAYE',
          amount: totals.payeTax,
          description: 'PAYE (estimated)',
          irdCode: profile?.irdTaxCode || 'M',
        })
      }

      payslips.push(payslip)
    }

    await logHrAudit({
      userId: req.authUser.id,
      action: 'generate',
      tableName: 'payroll_runs',
      newData: { runId: run.id, payslipCount: payslips.length },
    })

    return res.status(201).json({ success: true, data: { run, payslips } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const updatePayrollRunStatus = async (req, res) => {
  try {
    const run = await PayrollRun.findByPk(req.params.id)
    if (!run) return res.status(404).json({ success: false, message: 'Not found' })

    const { status } = req.body
    const updates = { status }

    if (status === 'locked') {
      updates.lockedAt = new Date()
      updates.lockedById = req.authUser.id
    }

    await run.update(updates)
    await logHrAudit({
      userId: req.authUser.id,
      action: 'status',
      tableName: 'payroll_runs',
      newData: run.get(),
    })

    return res.json({ success: true, data: run })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const getPayslip = async (req, res) => {
  try {
    const payslip = await Payslip.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: PayrollDeduction, as: 'deductions' },
        { model: PayrollRun, as: 'payrollRun' },
      ],
    })
    if (!payslip) return res.status(404).json({ success: false, message: 'Not found' })
    if (!assertPayslipAccess(req, payslip)) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    return res.json({ success: true, data: payslip })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const getPayslipsByUser = async (req, res) => {
  try {
    const userId = Number(req.params.userId)
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 500)
    const offset = (page - 1) * limit

    const { count, rows } = await Payslip.findAndCountAll({
      where: { userId },
      include: [
        {
          model: PayrollRun,
          as: 'payrollRun',
          attributes: ['id', 'month', 'year', 'status'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    })

    return res.json({
      success: true,
      data: rows,
      total: count,
      page,
      limit,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const getPayslipPdf = async (req, res) => {
  try {
    const payslip = await Payslip.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: PayrollDeduction, as: 'deductions' },
        { model: PayrollRun, as: 'payrollRun' },
      ],
    })
    if (!payslip) return res.status(404).json({ success: false, message: 'Not found' })
    if (!assertPayslipAccess(req, payslip)) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    const run = payslip.payrollRun
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Payslip</title>
<style>body{font-family:Arial,sans-serif;padding:24px;color:#111}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #ddd;padding:8px;text-align:left}h1{margin:0}</style>
</head><body>
<h1>VSP Interior — Payslip</h1>
<p><strong>Employee:</strong> ${payslip.user?.name || ''} (${payslip.user?.email || ''})</p>
<p><strong>Period:</strong> ${run?.month || ''} ${run?.year || ''}</p>
<table>
<tr><th>Earnings</th><th>Amount (NZD)</th></tr>
<tr><td>Base Pay</td><td>$${Number(payslip.basePay).toFixed(2)}</td></tr>
<tr><td>Overtime</td><td>$${Number(payslip.overtimePay).toFixed(2)}</td></tr>
<tr><td>Gross Pay</td><td>$${Number(payslip.grossPay).toFixed(2)}</td></tr>
</table>
<table>
<tr><th>Deductions</th><th>Amount (NZD)</th></tr>
<tr><td>PAYE (estimated)</td><td>$${Number(payslip.payeTax).toFixed(2)}</td></tr>
<tr><td>KiwiSaver (employee)</td><td>$${Number(payslip.kiwiSaverEmployee).toFixed(2)}</td></tr>
<tr><td>Other</td><td>$${Number(payslip.otherDeductions || 0).toFixed(2)}</td></tr>
<tr><td><strong>Net Pay</strong></td><td><strong>$${Number(payslip.netPay).toFixed(2)}</strong></td></tr>
</table>
<p><em>PAYE is an estimate until IRD tables are validated.</em></p>
</body></html>`

    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Content-Disposition', `inline; filename="payslip-${payslip.id}.html"`)
    return res.send(html)
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
