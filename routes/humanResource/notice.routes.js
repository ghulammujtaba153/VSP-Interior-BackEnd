import express from 'express'
import {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
  upload, // multer export from controller
} from '../../controller/humanResource/notice.controller.js'

const router = express.Router()

router.post('/create', upload.single('file'), createNotice)
router.get('/get', getNotices)
router.get('/:id', getNoticeById)
router.put('/update/:id', upload.single('file'), updateNotice)
router.delete('/delete/:id', deleteNotice)

export default router