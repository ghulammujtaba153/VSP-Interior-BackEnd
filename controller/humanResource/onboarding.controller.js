import db from '../../models/index.js'
import { Op } from 'sequelize'

const {
  User,
  Role,
  EmploymentProfile,
  Certification,
  EmployeeDocuments,
  LeaveBalance,
} = db

function buildChecklist(user, profile, certs, docs, balances) {
  const steps = [
    {
      id: 'profile',
      label: 'Employment profile',
      complete: Boolean(profile?.jobTitle && profile?.department && profile?.startDate),
    },
    {
      id: 'manager',
      label: 'Manager assigned',
      complete: Boolean(profile?.managerId),
    },
    {
      id: 'payroll',
      label: 'Payroll & bank details',
      complete: Boolean(profile?.bankAccount && profile?.irdTaxCode),
    },
    {
      id: 'kiwisaver',
      label: 'KiwiSaver configured',
      complete: profile != null && profile.kiwiSaverEnrolled !== undefined && profile.kiwiSaverEnrolled !== null,
    },
    {
      id: 'leave',
      label: 'Leave balances initialized',
      complete: balances.length > 0,
    },
    {
      id: 'documents',
      label: 'Required documents on file',
      complete: docs.some((d) => d.status === 'approved'),
    },
    {
      id: 'certifications',
      label: 'Compliance certification',
      complete: certs.length > 0,
    },
  ]

  const completed = steps.filter((s) => s.complete).length
  const percent = Math.round((completed / steps.length) * 100)

  return { steps, completed, total: steps.length, percent }
}

export const getOnboardingDashboard = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { status: 'active' },
      attributes: ['id', 'name', 'email', 'createdAt'],
      include: [{ model: Role, attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
      limit: 200,
    })

    const userIds = users.map((u) => u.id)

    const [profiles, certs, docs, balances] = await Promise.all([
      EmploymentProfile.findAll({ where: { userId: { [Op.in]: userIds } } }),
      Certification.findAll({ where: { userId: { [Op.in]: userIds } } }),
      EmployeeDocuments.findAll({ where: { employeeId: { [Op.in]: userIds } } }),
      LeaveBalance.findAll({ where: { userId: { [Op.in]: userIds } } }),
    ])

    const profileByUser = Object.fromEntries(profiles.map((p) => [p.userId, p]))
    const certsByUser = certs.reduce((acc, c) => {
      acc[c.userId] = acc[c.userId] || []
      acc[c.userId].push(c)
      return acc
    }, {})
    const docsByUser = docs.reduce((acc, d) => {
      acc[d.employeeId] = acc[d.employeeId] || []
      acc[d.employeeId].push(d)
      return acc
    }, {})
    const balancesByUser = balances.reduce((acc, b) => {
      acc[b.userId] = acc[b.userId] || []
      acc[b.userId].push(b)
      return acc
    }, {})

    const rows = users.map((user) => {
      const profile = profileByUser[user.id] || null
      const checklist = buildChecklist(
        user,
        profile,
        certsByUser[user.id] || [],
        docsByUser[user.id] || [],
        balancesByUser[user.id] || []
      )
      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.Role?.name,
        startDate: profile?.startDate || null,
        department: profile?.department || null,
        ...checklist,
      }
    })

    const incomplete = rows.filter((r) => r.percent < 100).length
    const avgPercent =
      rows.length > 0
        ? Math.round(rows.reduce((sum, r) => sum + r.percent, 0) / rows.length)
        : 0

    return res.json({
      success: true,
      data: {
        summary: {
          total: rows.length,
          incomplete,
          complete: rows.length - incomplete,
          avgPercent,
        },
        employees: rows,
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
