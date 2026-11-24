import db from '../models/index.js'

const { LeaveBalance, LeavePolicy } = db

export function daysBetween(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
  return Math.max(diff, 0)
}

export async function ensureLeaveBalances(userId, year = new Date().getFullYear()) {
  const policies = await LeavePolicy.findAll({ where: { isActive: true } })
  const balances = []

  for (const policy of policies) {
    const [balance] = await LeaveBalance.findOrCreate({
      where: { userId, leaveType: policy.leaveType, year },
      defaults: {
        entitled: policy.annualEntitlementDays,
        used: 0,
        pending: 0,
        remaining: policy.annualEntitlementDays,
      },
    })
    balances.push(balance)
  }

  return balances
}

export async function reserveLeaveDays(userId, leaveType, days, year = new Date().getFullYear()) {
  await ensureLeaveBalances(userId, year)
  const balance = await LeaveBalance.findOne({ where: { userId, leaveType, year } })

  if (!balance || Number(balance.remaining) < days) {
    throw new Error('Insufficient leave balance')
  }

  balance.pending = Number(balance.pending) + days
  balance.remaining = Number(balance.remaining) - days
  await balance.save()
  return balance
}

export async function finalizeLeaveApproval(leave, approved) {
  const year = new Date(leave.startDate).getFullYear()
  const days = daysBetween(leave.startDate, leave.endDate)
  const balance = await LeaveBalance.findOne({
    where: { userId: leave.employeeId, leaveType: mapLeaveType(leave.leaveType), year },
  })

  if (!balance) return

  if (approved) {
    balance.pending = Math.max(0, Number(balance.pending) - days)
    balance.used = Number(balance.used) + days
  } else {
    balance.pending = Math.max(0, Number(balance.pending) - days)
    balance.remaining = Number(balance.remaining) + days
  }

  await balance.save()
}

function mapLeaveType(leaveType) {
  const t = String(leaveType || '').toLowerCase()
  if (t.includes('sick')) return 'sick'
  if (t.includes('bereave')) return 'bereavement'
  if (t.includes('unpaid')) return 'unpaid'
  if (t.includes('annual') || t.includes('vacation')) return 'annual'
  return 'other'
}

export async function seedDefaultLeavePolicies() {
  const defaults = [
    { name: 'Annual Leave', leaveType: 'annual', annualEntitlementDays: 20 },
    { name: 'Sick Leave', leaveType: 'sick', annualEntitlementDays: 10 },
    { name: 'Bereavement Leave', leaveType: 'bereavement', annualEntitlementDays: 3 },
  ]

  for (const policy of defaults) {
    await LeavePolicy.findOrCreate({
      where: { leaveType: policy.leaveType },
      defaults: policy,
    })
  }
}
