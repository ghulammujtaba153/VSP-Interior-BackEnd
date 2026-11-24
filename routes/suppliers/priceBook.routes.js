import express from 'express'
import multer from 'multer'
import {
  createPriceBook,
  deletePriceBook,
  getPriceBook,
  getPriceBookHistory,
  getSupplierVersions,
  getImportHistory,
  getFormatOptions,
  previewPriceBookImport,
  commitPriceBookImport,
  importPriceBook,
  updatePriceBook,
} from '../../controller/suppliers/priceBook.controller.js'
import { priceAtQty } from '../../controller/project/projectCatalog.controller.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
})

const priceBookRouter = express.Router()

priceBookRouter.get('/formats', getFormatOptions)
priceBookRouter.post('/import/preview', upload.single('file'), previewPriceBookImport)
priceBookRouter.post('/import/commit', commitPriceBookImport)
priceBookRouter.post('/import', importPriceBook)
priceBookRouter.post('/create', createPriceBook)
priceBookRouter.get('/get', getPriceBook)
priceBookRouter.get('/get/:id', getPriceBook)
priceBookRouter.get('/versions/:supplierId', getSupplierVersions)
priceBookRouter.get('/price-at-qty/:supplierId/:sku', priceAtQty)
priceBookRouter.get('/imports/:supplierId', getImportHistory)
priceBookRouter.get('/history', getPriceBookHistory)
priceBookRouter.put('/update/:id', updatePriceBook)
priceBookRouter.delete('/delete/:id', deletePriceBook)

export default priceBookRouter
