import express from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { attachAuthUser } from '../middleware/hrPermissionMiddleware.js'
import { isHrAdmin } from '../utils/permissionUtils.js'
import db from '../models/index.js'

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsRoot = path.join(__dirname, '..', 'uploads')

const ALLOWED_FOLDERS = new Set(['employee-documents', 'notices'])
const { EmployeeDocuments } = db

router.get(
  '/:folder/:filename',
  authMiddleware,
  attachAuthUser,
  async (req, res) => {
    try {
      const { folder, filename } = req.params

      if (!ALLOWED_FOLDERS.has(folder)) {
        return res.status(403).json({ success: false, message: 'Forbidden' })
      }

      const filePath = path.join(uploadsRoot, folder, filename)

      if (!filePath.startsWith(uploadsRoot) || !fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'File not found' })
      }

      if (folder === 'notices') {
        return res.sendFile(filePath)
      }

      if (folder === 'employee-documents') {
        if (isHrAdmin(req.authUser)) {
          return res.sendFile(filePath)
        }

        const doc = await EmployeeDocuments.findOne({
          where: { documentUrl: `/uploads/employee-documents/${filename}` },
        })

        if (doc && Number(doc.employeeId) === req.authUser.id) {
          return res.sendFile(filePath)
        }

        return res.status(403).json({ success: false, message: 'Access denied' })
      }

      return res.status(403).json({ success: false, message: 'Forbidden' })
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }
)

export default router
