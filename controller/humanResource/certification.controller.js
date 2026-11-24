import db from '../../models/index.js'
import { Op } from 'sequelize'
import { isHrAdmin } from '../../utils/permissionUtils.js'
import { logHrAudit } from '../../service/hrAuditService.js'

const { Certification, User } = db

function deriveStatus(expiryDate) {
  if (!expiryDate) return 'valid'
  const today = new Date()
  const expiry = new Date(expiryDate)
  const days = (expiry - today) / (1000 * 60 * 60 * 24)
  if (days < 0) return 'expired'
  if (days <= 30) return 'expiring_soon'
  return 'valid'
}

export const listCertifications = async (req, res) => {
  try {
    const where = {}
    if (!isHrAdmin(req.authUser)) {
      where.userId = req.authUser.id
    } else if (req.query.userId) {
      where.userId = req.query.userId
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100)
    const offset = (page - 1) * limit
    const { search } = req.query

    if (search?.trim()) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { issuer: { [Op.iLike]: `%${search}%` } },
        { status: { [Op.iLike]: `%${search}%` } },
      ]
    }

    const { count, rows } = await Certification.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['expiryDate', 'ASC']],
      limit,
      offset,
    })
    return res.json({ success: true, data: rows, total: count, page, limit })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const getExpiringCertifications = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30
    const target = new Date()
    target.setDate(target.getDate() + days)

    const certs = await Certification.findAll({
      where: {
        expiryDate: { [Op.lte]: target.toISOString().split('T')[0] },
        status: { [Op.ne]: 'expired' },
      },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
    })
    return res.json({ success: true, data: certs })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const createCertification = async (req, res) => {
  try {
    const userId = isHrAdmin(req.authUser) ? req.body.userId || req.authUser.id : req.authUser.id
    const status = deriveStatus(req.body.expiryDate)
    const cert = await Certification.create({ ...req.body, userId, status })
    await logHrAudit({
      userId: req.authUser.id,
      action: 'create',
      tableName: 'certifications',
      newData: cert.get(),
    })
    return res.status(201).json({ success: true, data: cert })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const updateCertification = async (req, res) => {
  try {
    const cert = await Certification.findByPk(req.params.id)
    if (!cert) return res.status(404).json({ success: false, message: 'Not found' })
    if (!isHrAdmin(req.authUser) && cert.userId !== req.authUser.id) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    const status = deriveStatus(req.body.expiryDate || cert.expiryDate)
    await cert.update({ ...req.body, status })
    return res.json({ success: true, data: cert })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteCertification = async (req, res) => {
  try {
    const cert = await Certification.findByPk(req.params.id)
    if (!cert) return res.status(404).json({ success: false, message: 'Not found' })
    await cert.destroy()
    return res.json({ success: true, message: 'Deleted' })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
