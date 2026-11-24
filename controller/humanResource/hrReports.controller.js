import db from '../../models/index.js'
import { Op } from 'sequelize'

const {
  User,
  EmploymentProfile,
  EmployeeLeave,
  Payslip,
  Certification,
  EmployeeTimeSheet,
} = db

export const getHrDashboardReports = async (req, res) => {
  try {
    const headcount = await EmploymentProfile.findAll({
      attributes: ['department'],
      include: [{ model: User, as: 'user', attributes: ['id'] }],
    })

    const byDepartment = headcount.reduce((acc, row) => {
      const dept = row.department || 'Unassigned'
      acc[dept] = (acc[dept] || 0) + 1
      return acc
    }, {})

    const pendingLeave = await EmployeeLeave.count({ where: { status: 'pending' } })
    const pendingTimesheets = await EmployeeTimeSheet.count({
      where: { status: { [Op.in]: ['pending', 'submitted'] } },
    })

    const labourByMonth = await Payslip.findAll({
      attributes: ['grossPay', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 100,
    })

    const expiringCerts = await Certification.count({
      where: { status: 'expiring_soon' },
    })

    return res.json({
      success: true,
      data: {
        headcountByDepartment: byDepartment,
        pendingLeave,
        pendingTimesheets,
        expiringCertifications: expiringCerts,
        recentLabourCost: labourByMonth,
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const getTimesheetReconciliation = async (req, res) => {
  try {
    // Stub for project scheduling reconciliation — returns approved hours summary
    const approved = await EmployeeTimeSheet.findAll({
      where: { status: { [Op.in]: ['approved', 'locked'] } },
      attributes: ['employeeId', 'date', 'startTime', 'endTime', 'breakMinutes'],
    })

    return res.json({
      success: true,
      data: {
        message: 'Timesheet reconciliation stub — compare with job scheduling hours in Phase 7',
        approvedCount: approved.length,
        records: approved,
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const createPayrollJournalStub = async (req, res) => {
  try {
    const { payrollRunId } = req.body
    return res.json({
      success: true,
      data: {
        message: 'Accounts journal stub created',
        payrollRunId,
        entries: [
          { account: 'Labour Expense', debit: 'grossPay' },
          { account: 'PAYE Payable', credit: 'payeTax' },
          { account: 'KiwiSaver Payable', credit: 'kiwiSaverEmployee' },
          { account: 'Wages Payable', credit: 'netPay' },
        ],
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const getStaffStats = async (req, res) => {
  try {
    const total = await User.count()
    const active = await User.count({ where: { status: 'active' } })
    const suspended = await User.count({ where: { status: 'suspended' } })
    return res.json({
      success: true,
      data: { total, active, suspended },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
