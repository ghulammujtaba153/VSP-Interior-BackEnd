import db from '../../models/index.js'
import { isHrAdmin } from '../../utils/permissionUtils.js'
import { logHrAudit } from '../../service/hrAuditService.js'

const { EmploymentProfile, User, Worker } = db

export const getEmploymentProfile = async (req, res) => {
  try {
    const userId = Number(req.params.id)
    if (!isHrAdmin(req.authUser) && req.authUser.id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    const profile = await EmploymentProfile.findOne({
      where: { userId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'manager', attributes: ['id', 'name', 'email'] },
      ],
    })

    const worker = await Worker.findOne({ where: { userId } })

    return res.json({ success: true, data: { profile, worker } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const upsertEmploymentProfile = async (req, res) => {
  try {
    const userId = Number(req.params.id)
    const allowed = [
      'employeeNumber', 'department', 'jobTitle', 'costCentre', 'managerId',
      'employmentType', 'startDate', 'endDate', 'standardHoursPerWeek',
      'standardHoursPerDay', 'hourlyRate', 'annualSalary', 'irdTaxCode',
      'kiwiSaverEnrolled', 'kiwiSaverRate', 'kiwiSaverEmployerRate', 'bankAccount',
    ]

    const payload = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) payload[key] = req.body[key]
    }

    const [profile, created] = await EmploymentProfile.findOrCreate({
      where: { userId },
      defaults: { userId, ...payload },
    })

    if (!created) {
      const oldData = profile.get()
      await profile.update(payload)
      await logHrAudit({
        userId: req.authUser.id,
        action: 'update',
        tableName: 'employment_profiles',
        oldData,
        newData: profile.get(),
      })
    }

    if (req.body.workerId !== undefined) {
      await Worker.update({ userId: null }, { where: { userId } })
      if (req.body.workerId) {
        await Worker.update({ userId }, { where: { id: req.body.workerId } })
      }
    }

    return res.json({ success: true, data: profile })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const backfillWorkerUserLinks = async (req, res) => {
  try {
    const workers = await Worker.findAll({ where: { userId: null } })
    let linked = 0

    for (const worker of workers) {
      const user = await User.findOne({ where: { email: worker.email } })
      if (user) {
        await worker.update({ userId: user.id })
        linked += 1
      }
    }

    return res.json({ success: true, data: { linked, total: workers.length } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
