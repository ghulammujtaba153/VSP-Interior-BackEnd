import db from '../../models/index.js'
import { Sequelize, Op } from 'sequelize'
import { isHrAdmin } from '../../utils/permissionUtils.js'
import {
  daysBetween,
  reserveLeaveDays,
  finalizeLeaveApproval,
  ensureLeaveBalances,
} from '../../service/leaveBalanceService.js'
import { logHrAudit } from '../../service/hrAuditService.js'
import { canApproveForEmployee } from '../../service/managerService.js'

const { EmployeeLeave, Audit, User } = db

const pickLeaveFields = (body, { includeStatus = false } = {}) => {
  const allowed = ['employeeId', 'leaveType', 'startDate', 'endDate', 'reason']
  if (includeStatus) allowed.push('status')
  const payload = {}
  for (const key of allowed) {
    if (body[key] !== undefined) payload[key] = body[key]
  }
  return payload
}

export const createEmployeeLeave = async (req, res) => {
  try {
    const payload = pickLeaveFields(req.body)
    payload.employeeId = isHrAdmin(req.authUser)
      ? payload.employeeId || req.authUser.id
      : req.authUser.id
    payload.status = 'pending'

    const days = daysBetween(payload.startDate, payload.endDate)
    await reserveLeaveDays(payload.employeeId, payload.leaveType, days)

    const employeeLeave = await EmployeeLeave.create(payload)
    await logHrAudit({
      userId: req.authUser.id,
      action: 'create',
      tableName: 'employee_leaves',
      newData: employeeLeave.get(),
    })

    res.status(201).json({ success: true, message: 'Employee leave created', data: employeeLeave })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

export const getEmployeeLeaves = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query
    const offset = (page - 1) * limit
    let whereClause = {}

    if (!isHrAdmin(req.authUser)) {
      whereClause.employeeId = req.authUser.id
    }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    if (search) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { '$employee.name$': { [Op.iLike]: `%${search}%` } },
          { leaveType: { [Op.iLike]: `%${search}%` } },
          { status: { [Op.iLike]: `%${search}%` } },
          { reason: { [Op.iLike]: `%${search}%` } },
        ],
      }
    }

    const { count, rows } = await EmployeeLeave.findAndCountAll({
      include: [{ model: User, as: 'employee', attributes: ['id', 'name', 'email'] }],
      where: whereClause,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']],
    })

    const today = new Date().toISOString().split('T')[0]
    const leavesToday = await EmployeeLeave.findAll({
      where: {
        startDate: { [Op.lte]: today },
        endDate: { [Op.gte]: today },
        status: 'approved',
      },
      include: [{ model: User, as: 'employee', attributes: ['id', 'name', 'email'] }],
    })

    const totalUsers = await User.count()
    const uniqueEmployeesOnLeaveToday = [
      ...new Map(leavesToday.map((leave) => [leave.employeeId, leave.employee])).values(),
    ]

    res.status(200).json({
      success: true,
      employeeLeaves: rows,
      total: count,
      availableStaff: totalUsers - uniqueEmployeesOnLeaveToday.length,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(count / limit),
      totalEmployeesOnLeaveToday: uniqueEmployeesOnLeaveToday.length,
      employeesOnLeaveToday: uniqueEmployeesOnLeaveToday,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getEmployeeLeaveByEmployeeId = async (req, res) => {
  try {
    const employeeId = Number(req.params.employeeId || req.params.id)
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
        { leaveType: { [Op.iLike]: `%${search}%` } },
        { status: { [Op.iLike]: `%${search}%` } },
        { reason: { [Op.iLike]: `%${search}%` } },
      ]
    }

    const { count, rows } = await EmployeeLeave.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    })

    const allLeaves = await EmployeeLeave.findAll({ where: baseWhere })
    const summary = {
      total: allLeaves.length,
      approved: allLeaves.filter((l) => l.status?.toLowerCase() === 'approved').length,
      pending: allLeaves.filter((l) => l.status?.toLowerCase() === 'pending').length,
      usedDays: allLeaves
        .filter((l) => l.status?.toLowerCase() === 'approved')
        .reduce((acc, l) => acc + daysBetween(l.startDate, l.endDate), 0),
    }

    const balances = await ensureLeaveBalances(employeeId)

    const chartLeaves = await EmployeeLeave.findAll({
      where: baseWhere,
      order: [['createdAt', 'DESC']],
      limit: 200,
    })

    res.status(200).json({
      success: true,
      employeeLeave: rows,
      total: count,
      page,
      limit,
      balances,
      summary,
      chartLeaves,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getEmployeeLeaveById = async (req, res) => {
  try {
    const leave = await EmployeeLeave.findByPk(req.params.leaveId)
    if (!leave) return res.status(404).json({ success: false, message: 'Not found' })
    if (!isHrAdmin(req.authUser) && leave.employeeId !== req.authUser.id) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    return res.json({ success: true, data: leave })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const updateEmployeeLeave = async (req, res) => {
  try {
    const employeeLeave = await EmployeeLeave.findByPk(req.params.id)
    if (!employeeLeave) {
      return res.status(404).json({ success: false, message: 'Employee leave not found' })
    }

    const oldData = employeeLeave.get()
    const hr = isHrAdmin(req.authUser)
    const isOwner = employeeLeave.employeeId === req.authUser.id
    const canApprove = await canApproveForEmployee(req.authUser, employeeLeave.employeeId)

    if (!hr && !isOwner && !canApprove) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    const allowStatusChange = hr || canApprove
    let payload

    if (canApprove && !hr && !isOwner) {
      if (!req.body.status) {
        return res.status(400).json({ success: false, message: 'Managers may only approve or reject' })
      }
      payload = { status: req.body.status }
    } else {
      payload = pickLeaveFields(req.body, { includeStatus: allowStatusChange })
    }

    if (payload.status && allowStatusChange) {
      payload.approvedById = req.authUser.id
      payload.approvedAt = new Date()
      if (payload.status === 'rejected' && req.body.rejectionReason) {
        payload.rejectionReason = req.body.rejectionReason
      }
      await finalizeLeaveApproval(employeeLeave, payload.status === 'approved')
    }

    await employeeLeave.update(payload)
    await logHrAudit({
      userId: req.authUser.id,
      action: 'update',
      tableName: 'employee_leaves',
      oldData,
      newData: employeeLeave.get(),
    })

    res.status(200).json({ success: true, data: employeeLeave })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteEmployeeLeave = async (req, res) => {
  try {
    const id = req.params.id || req.body.id
    const employeeLeave = await EmployeeLeave.findByPk(id)
    if (!employeeLeave) {
      return res.status(404).json({ success: false, message: 'Employee leave not found' })
    }
    if (!isHrAdmin(req.authUser) && employeeLeave.employeeId !== req.authUser.id) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    const oldData = employeeLeave.get()
    await employeeLeave.destroy()
    await logHrAudit({
      userId: req.authUser.id,
      action: 'delete',
      tableName: 'employee_leaves',
      oldData,
    })

    res.status(200).json({ success: true, message: 'Employee leave deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
