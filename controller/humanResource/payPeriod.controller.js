import db from '../../models/index.js'
import { logHrAudit } from '../../service/hrAuditService.js'

const { PayPeriod, EmployeeTimeSheet } = db

export const listPayPeriods = async (req, res) => {
  try {
    const periods = await PayPeriod.findAll({ order: [['startDate', 'DESC']] })
    return res.json({ success: true, data: periods })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const createPayPeriod = async (req, res) => {
  try {
    const period = await PayPeriod.create(req.body)
    return res.status(201).json({ success: true, data: period })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const lockPayPeriod = async (req, res) => {
  try {
    const period = await PayPeriod.findByPk(req.params.id)
    if (!period) return res.status(404).json({ success: false, message: 'Not found' })

    await period.update({
      status: 'locked',
      lockedAt: new Date(),
      lockedById: req.authUser.id,
    })

    await EmployeeTimeSheet.update(
      { status: 'locked' },
      { where: { payPeriodId: period.id, status: 'approved' } }
    )

    await logHrAudit({
      userId: req.authUser.id,
      action: 'lock',
      tableName: 'pay_periods',
      newData: period.get(),
    })

    return res.json({ success: true, data: period })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
