import db from '../../models/index.js'
import {
  ensureLeaveBalances,
  seedDefaultLeavePolicies,
} from '../../service/leaveBalanceService.js'

const { LeavePolicy, LeaveBalance } = db

export const getLeavePolicies = async (req, res) => {
  try {
    await seedDefaultLeavePolicies()
    const policies = await LeavePolicy.findAll({ where: { isActive: true } })
    return res.json({ success: true, data: policies })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const getLeaveBalances = async (req, res) => {
  try {
    const userId = Number(req.params.userId)
    const year = Number(req.query.year) || new Date().getFullYear()
    const balances = await ensureLeaveBalances(userId, year)
    return res.json({ success: true, data: balances })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const upsertLeavePolicy = async (req, res) => {
  try {
    const { id, name, leaveType, annualEntitlementDays, carryOverDays, isActive } = req.body
    if (id) {
      const policy = await LeavePolicy.findByPk(id)
      if (!policy) return res.status(404).json({ success: false, message: 'Not found' })
      await policy.update({ name, leaveType, annualEntitlementDays, carryOverDays, isActive })
      return res.json({ success: true, data: policy })
    }
    const policy = await LeavePolicy.create(req.body)
    return res.status(201).json({ success: true, data: policy })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
