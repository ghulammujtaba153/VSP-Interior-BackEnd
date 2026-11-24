import express from 'express'
import {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
  upload,
} from '../../controller/humanResource/notice.controller.js'
import { hrAdmin, hrAuth } from '../../middleware/hrRouteGuards.js'

const router = express.Router()

router.post('/create', ...hrAdmin, upload.single('file'), createNotice)
router.get('/get', ...hrAuth, getNotices)
router.get('/:id', ...hrAuth, getNoticeById)
router.put('/update/:id', ...hrAdmin, upload.single('file'), updateNotice)
router.delete('/delete/:id', ...hrAdmin, deleteNotice)

export default router
