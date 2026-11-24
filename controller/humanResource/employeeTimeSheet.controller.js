import db from '../../models/index.js'
import { Op, fn, col, literal } from 'sequelize'
import { isHrAdmin } from '../../utils/permissionUtils.js'
import { parseTimeToHours } from '../../service/nzPayrollService.js'
import { logHrAudit } from '../../service/hrAuditService.js'
import { canApproveForEmployee } from '../../service/managerService.js'

const { EmployeeTimeSheet, User } = db

const pickTimesheetFields = (body, { includeStatus = false } = {}) => {
  const allowed = [
    'employeeId', 'date', 'startTime', 'endTime', 'overWork',
    'breakMinutes', 'payPeriodId',
  ]
  if (includeStatus) allowed.push('status')
  const payload = {}
  for (const key of allowed) {
    if (body[key] !== undefined) payload[key] = body[key]
  }
  return payload
}

export const createEmployeeTimeSheet = async (req, res) => {
  try {
    const payload = pickTimesheetFields(req.body)
    payload.employeeId = isHrAdmin(req.authUser)
      ? payload.employeeId || req.authUser.id
      : req.authUser.id
    payload.status = payload.status || 'draft'
    if (!isHrAdmin(req.authUser) && payload.status && !['draft', 'submitted'].includes(payload.status)) {
      payload.status = 'draft'
    }

    const employeeTimeSheet = await EmployeeTimeSheet.create(payload)
    return res.status(201).json({ success: true, data: employeeTimeSheet })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const getEmployeeTimeSheet = async (req, res) => {
  try {
    let { page = 1, limit = 10, Search, startDate, endDate, status, payPeriodId } = req.query
    page = parseInt(page)
    limit = parseInt(limit)
    const offset = (page - 1) * limit
    const whereConditions = {}

    if (!isHrAdmin(req.authUser)) {
      whereConditions.employeeId = req.authUser.id
    }

    if (status && status !== 'all') whereConditions.status = status
    if (payPeriodId) whereConditions.payPeriodId = payPeriodId
    if (startDate?.trim()) whereConditions.date = { [Op.gte]: startDate }
    if (endDate?.trim()) {
      whereConditions.date = { ...(whereConditions.date || {}), [Op.lte]: endDate }
    }

    const includeOptions = {
      model: User,
      as: 'employee',
      attributes: ['id', 'name', 'email'],
    }

    if (Search?.trim()) {
      includeOptions.where = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${Search}%` } },
          { email: { [Op.iLike]: `%${Search}%` } },
        ],
      }
    }

    const { count, rows } = await EmployeeTimeSheet.findAndCountAll({
      where: whereConditions,
      offset,
      limit,
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      include: [includeOptions],
    })

    const statsRows = await EmployeeTimeSheet.findAll({
      attributes: ['status', 'startTime', 'endTime', 'breakMinutes'],
      where: whereConditions,
    })

    const approvedList = statsRows.filter((t) => t.status === 'approved' || t.status === 'locked')
    const netHours = approvedList.reduce(
      (acc, t) => acc + parseTimeToHours(t.startTime, t.endTime, t.breakMinutes || 0),
      0
    )

    return res.status(200).json({
      success: true,
      total: count,
      page,
      limit,
      data: rows,
      stats: {
        total: statsRows.length,
        pendingCount: statsRows.filter((t) => ['pending', 'submitted', 'draft'].includes(t.status)).length,
        approvedTotal: Math.round(netHours * 100) / 100,
        avgWorkload: approvedList.length ? Math.round((netHours / approvedList.length) * 100) / 100 : 0,
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const getEmployeeTimeSheetById = async (req, res) => {
  try {
    const employeeTimeSheet = await EmployeeTimeSheet.findByPk(req.params.id, {
      include: [{ model: User, as: 'employee', attributes: ['id', 'name', 'email'] }],
    })
    if (!employeeTimeSheet) return res.status(404).json({ success: false, message: 'Not found' })
    if (!isHrAdmin(req.authUser) && employeeTimeSheet.employeeId !== req.authUser.id) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    return res.status(200).json({ success: true, data: employeeTimeSheet })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const employeeTimeSheetByEmployeeId = async (req, res) => {
  try {
    const employeeId = Number(req.params.id)
    if (!isHrAdmin(req.authUser) && req.authUser.id !== employeeId) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100)
    const offset = (page - 1) * limit
    const { search } = req.query

    const baseWhere = { employeeId }
    const where = { ...baseWhere }
    if (search?.trim()) {
      where[Op.or] = [
        { date: { [Op.iLike]: `%${search}%` } },
        { status: { [Op.iLike]: `%${search}%` } },
      ]
    }

    const { count, rows } = await EmployeeTimeSheet.findAndCountAll({
      where,
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset,
    })

    const today = new Date().toISOString().split('T')[0]
    const todayEntry = await EmployeeTimeSheet.findOne({ where: { employeeId, date: today } })

    const allRows = await EmployeeTimeSheet.findAll({ where: baseWhere })
    const approvedList = allRows.filter((t) => t.status === 'approved' || t.status === 'locked')
    const approvedHours = approvedList.reduce(
      (acc, t) => acc + parseTimeToHours(t.startTime, t.endTime, t.breakMinutes || 0),
      0
    )

    const heatmapDates = allRows.map((t) => ({ date: t.date }))

    const chartTimesheets = await EmployeeTimeSheet.findAll({
      where: baseWhere,
      attributes: ['date', 'startTime', 'endTime', 'overWork', 'breakMinutes', 'status'],
      order: [['date', 'DESC']],
      limit: 200,
    })

    return res.status(200).json({
      success: true,
      data: rows,
      total: count,
      page,
      limit,
      todayEntry,
      stats: {
        total: allRows.length,
        approvedHours: Math.round(approvedHours * 10) / 10,
        overworkDays: allRows.filter((t) => t.overWork && t.overWork !== '00:00:00').length,
      },
      heatmapDates,
      chartTimesheets,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const updateEmployeeTimeSheet = async (req, res) => {
  try {
    const sheet = await EmployeeTimeSheet.findByPk(req.params.id)
    if (!sheet) return res.status(404).json({ success: false, message: 'Not found' })
    if (!isHrAdmin(req.authUser) && sheet.employeeId !== req.authUser.id) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    if (sheet.status === 'locked') {
      return res.status(400).json({ success: false, message: 'Timesheet is locked' })
    }

    const hr = isHrAdmin(req.authUser)
    const payload = pickTimesheetFields(req.body, { includeStatus: hr })

    if (!hr) {
      if (payload.status && !['draft', 'submitted'].includes(payload.status)) {
        delete payload.status
      }
    }

    await sheet.update(payload)
    return res.status(200).json({ success: true, data: sheet })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const submitEmployeeTimeSheet = async (req, res) => {
  try {
    const sheet = await EmployeeTimeSheet.findByPk(req.params.id)
    if (!sheet || sheet.employeeId !== req.authUser.id) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    await sheet.update({ status: 'submitted' })
    return res.json({ success: true, data: sheet })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const approveEmployeeTimeSheet = async (req, res) => {
  try {
    const sheet = await EmployeeTimeSheet.findByPk(req.params.id)
    if (!sheet) return res.status(404).json({ success: false, message: 'Not found' })

    const canApprove = await canApproveForEmployee(req.authUser, sheet.employeeId)
    if (!canApprove) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    const status = req.body.status === 'rejected' ? 'rejected' : 'approved'
    await sheet.update({
      status,
      approvedById: req.authUser.id,
      approvedAt: new Date(),
    })
    await logHrAudit({
      userId: req.authUser.id,
      action: status,
      tableName: 'employee_timesheets',
      newData: sheet.get(),
    })
    return res.json({ success: true, data: sheet })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteEmployeeTimeSheet = async (req, res) => {
  try {
    const sheet = await EmployeeTimeSheet.findByPk(req.params.id)
    if (!sheet) return res.status(404).json({ success: false, message: 'Not found' })
    if (!isHrAdmin(req.authUser) && sheet.employeeId !== req.authUser.id) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    await sheet.destroy()
    return res.status(200).json({ success: true, message: 'Deleted' })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
