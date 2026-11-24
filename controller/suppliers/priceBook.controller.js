import db from '../../models/index.js'
import { Op } from 'sequelize'
import {
  previewImport,
  nextVersion,
} from '../../service/priceBookImportService.js'
import { FORMAT_OPTIONS } from '../../config/priceBookFormats.js'

const { PriceBook, PriceBookImport, Suppliers, User } = db

export const IMPORT_CHUNK_SIZE = 100

const supplierInclude = {
  model: Suppliers,
  as: 'supplier',
  attributes: ['id', 'name', 'email', 'phone'],
}

function truncate(str, max = 255) {
  const s = String(str || '').trim()
  if (s.length <= max) return s
  return s.slice(0, max - 1) + '…'
}

function toPlainItem(item, supplierId, version, batchId, sourceFileName) {
  const sku = truncate(item.sku, 255)
  return {
    supplierId,
    sku,
    name: truncate(item.name || item.description || sku, 255),
    description: item.description || item.name || '',
    category: item.category ? truncate(item.category, 255) : null,
    unit: item.unit ? truncate(item.unit, 64) : null,
    variant: item.attributes?.colour || item.variant ? truncate(item.attributes?.colour || item.variant, 255) : null,
    basePrice: item.basePrice,
    priceTiers: item.priceTiers || [],
    attributes: item.attributes || {},
    currency: 'NZD',
    dynamic: {
      unit: item.unit,
      basePrice: item.basePrice,
      tiers: item.priceTiers,
    },
    importBatchId: batchId,
    sourceFileName: sourceFileName ? truncate(sourceFileName, 512) : null,
    version,
    status: 'active',
  }
}

function dedupeItemsBySku(items) {
  const bySku = new Map()
  for (const item of items) {
    const sku = String(item.sku || '').trim()
    if (!sku) continue
    const prev = bySku.get(sku)
    if (prev && item.priceTiers?.length) {
      const mergedTiers = [...(prev.priceTiers || []), ...(item.priceTiers || [])]
      bySku.set(sku, { ...prev, ...item, priceTiers: mergedTiers })
    } else {
      bySku.set(sku, item)
    }
  }
  return Array.from(bySku.values())
}

function formatDbError(error) {
  if (error?.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors?.[0]?.path || error.fields?.join?.(', ') || 'unknown'
    return `Duplicate value for ${field}. A legacy (name, version) index may still exist — restart the API server to apply schema patches.`
  }
  if (error?.errors?.length) {
    return error.errors.map((e) => e.message).join('; ')
  }
  return error.message
}

export const getFormatOptions = async (req, res) => {
  res.json({ success: true, formats: FORMAT_OPTIONS })
}

export const previewPriceBookImport = async (req, res) => {
  try {
    const supplierId = Number(req.body.supplierId)
    const formatKey = req.body.formatKey || null
    const file = req.file
    if (!supplierId) return res.status(400).json({ error: 'supplierId is required' })
    if (!file) return res.status(400).json({ error: 'file is required' })

    const supplier = await Suppliers.findByPk(supplierId)
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' })

    const result = previewImport(file.buffer, file.originalname, formatKey || undefined)
    res.json({ success: true, supplierId, ...result, preview: result.items.slice(0, 50) })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

async function upsertImportItems({
  items,
  sid,
  version,
  batchId,
  fileName,
  replaceExisting,
  versionAction,
  transaction,
}) {
  let insertedCount = 0
  let updatedCount = 0
  let skippedCount = 0

  const uniqueItems = dedupeItemsBySku(items)

  for (const item of uniqueItems) {
    const payload = toPlainItem(item, sid, version, batchId, fileName)
    if (!payload.sku) {
      skippedCount += 1
      continue
    }

    const existing = await PriceBook.findOne({
      where: { supplierId: sid, sku: payload.sku, version },
      transaction,
    })

    if (existing) {
      if (replaceExisting || versionAction === 'existing') {
        await existing.update(payload, { transaction })
        updatedCount += 1
      } else {
        skippedCount += 1
      }
    } else {
      await PriceBook.create(payload, { transaction })
      insertedCount += 1
    }
  }

  return { insertedCount, updatedCount, skippedCount }
}

export const commitPriceBookImport = async (req, res) => {
  const transaction = await db.sequelize.transaction()
  try {
    const {
      supplierId,
      items,
      version: requestedVersion,
      versionAction = 'new',
      formatKey,
      fileName,
      replaceExisting = false,
      importBatchId,
      chunkIndex = 0,
      totalChunks = 1,
      totalItems,
      finalize = false,
    } = req.body

    const sid = Number(supplierId)
    if (!sid || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback()
      return res.status(400).json({ error: 'supplierId and items are required' })
    }

    const supplier = await Suppliers.findByPk(sid, { transaction })
    if (!supplier) {
      await transaction.rollback()
      return res.status(404).json({ error: 'Supplier not found' })
    }

    const isFirstChunk = chunkIndex === 0 && !importBatchId
    const isLastChunk = finalize || chunkIndex >= totalChunks - 1

    let batch
    let version

    if (isFirstChunk) {
      const existingVersions = await PriceBook.findAll({
        where: { supplierId: sid },
        attributes: ['version'],
        group: ['version'],
        transaction,
      })
      const versionList = [...new Set(existingVersions.map((r) => r.version).filter(Boolean))]

      version = requestedVersion
      if (versionAction === 'new' || !version) {
        version = nextVersion(versionList)
        await PriceBook.update(
          { status: 'inactive', versionEndDate: new Date() },
          { where: { supplierId: sid, status: 'active' }, transaction }
        )
      }

      batch = await PriceBookImport.create(
        {
          supplierId: sid,
          fileName: fileName || 'import',
          formatKey: formatKey || 'custom',
          version,
          status: 'processing',
          importedById: req.authUser?.id || null,
          rowCount: totalItems || items.length,
        },
        { transaction }
      )
    } else {
      if (!importBatchId) {
        await transaction.rollback()
        return res.status(400).json({ error: 'importBatchId is required for subsequent chunks' })
      }
      batch = await PriceBookImport.findByPk(importBatchId, { transaction })
      if (!batch || batch.supplierId !== sid) {
        await transaction.rollback()
        return res.status(404).json({ error: 'Import batch not found' })
      }
      if (batch.status !== 'processing') {
        await transaction.rollback()
        return res.status(400).json({ error: 'Import batch is no longer accepting chunks' })
      }
      version = batch.version
    }

    const counts = await upsertImportItems({
      items,
      sid,
      version,
      batchId: batch.id,
      fileName: fileName || batch.fileName,
      replaceExisting,
      versionAction,
      transaction,
    })

    await batch.increment(counts, { transaction })
    await batch.reload({ transaction })

    if (isLastChunk) {
      await batch.update({ status: 'completed' }, { transaction })
    }

    await transaction.commit()

    const response = {
      success: true,
      version,
      importBatchId: batch.id,
      chunkIndex,
      totalChunks,
      complete: isLastChunk,
      insertedCount: batch.insertedCount,
      updatedCount: batch.updatedCount,
      skippedCount: batch.skippedCount,
    }

    if (isLastChunk) {
      response.message = `Import complete: ${batch.insertedCount} inserted, ${batch.updatedCount} updated, ${batch.skippedCount} skipped`
    }

    res.status(isLastChunk ? 201 : 200).json(response)
  } catch (error) {
    await transaction.rollback()
    console.error('Pricebook import commit failed:', error)
    res.status(500).json({ error: formatDbError(error) })
  }
}

export const createPriceBook = async (req, res) => {
  try {
    const { name, version, supplierId, sku } = req.body
    if (!supplierId) return res.status(400).json({ error: 'supplierId is required' })

    const supplier = await Suppliers.findByPk(supplierId)
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' })

    const targetVersion = version || 'v1'
    const itemSku = sku || name

    const existingItem = await PriceBook.findOne({
      where: { supplierId, sku: itemSku, version: targetVersion },
    })
    if (existingItem) {
      return res.status(400).json({
        error: `SKU "${itemSku}" already exists in ${targetVersion} for this supplier`,
      })
    }

    const priceBook = await PriceBook.create({
      ...req.body,
      sku: itemSku,
      supplierId,
      version: targetVersion,
      status: req.body.status || 'active',
    })
    res.status(201).json(priceBook)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const importPriceBook = async (req, res) => {
  return commitPriceBookImport(req, res)
}

export const getPriceBook = async (req, res) => {
  try {
    const supplierId = req.params.id ? Number(req.params.id) : null
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 500)
    const offset = (page - 1) * limit
    const { search, version, status } = req.query

    const where = {}
    if (supplierId) where.supplierId = supplierId
    if (version && version !== 'all') where.version = version
    if (status && status !== 'all') where.status = status
    if (search?.trim()) {
      where[Op.or] = [
        { sku: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { category: { [Op.iLike]: `%${search}%` } },
      ]
    }

    const { count, rows } = await PriceBook.findAndCountAll({
      where,
      include: [supplierInclude],
      order: [['sku', 'ASC']],
      limit,
      offset,
    })

    res.status(200).json({
      success: true,
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getSupplierVersions = async (req, res) => {
  try {
    const supplierId = Number(req.params.supplierId)
    const rows = await PriceBook.findAll({
      where: { supplierId },
      attributes: ['version'],
      group: ['version'],
      order: [['version', 'DESC']],
    })
    const versions = rows.map((r) => r.version).filter(Boolean)
    res.json({ success: true, versions })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getImportHistory = async (req, res) => {
  try {
    const supplierId = Number(req.params.supplierId)
    const imports = await PriceBookImport.findAll({
      where: { supplierId },
      include: [
        { model: User, as: 'importedBy', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 50,
    })
    res.json({ success: true, data: imports })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updatePriceBook = async (req, res) => {
  try {
    const itemId = req.params.id
    const currentItem = await PriceBook.findByPk(itemId)
    if (!currentItem) return res.status(404).json({ error: 'Item not found' })

    const checkSku = req.body.sku || currentItem.sku
    const checkVersion = req.body.version || currentItem.version
    const checkSupplier = req.body.supplierId || currentItem.supplierId

    const existingItem = await PriceBook.findOne({
      where: { supplierId: checkSupplier, sku: checkSku, version: checkVersion },
    })
    if (existingItem && existingItem.id !== parseInt(itemId, 10)) {
      return res.status(400).json({
        error: `SKU "${checkSku}" already exists in ${checkVersion}`,
      })
    }

    await PriceBook.update(req.body, { where: { id: itemId } })
    const updated = await PriceBook.findByPk(itemId, { include: [supplierInclude] })
    res.status(200).json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getPriceBookHistory = async (req, res) => {
  const { name, sku, supplierId } = req.query
  try {
    const where = {}
    if (name) where.name = name
    if (sku) where.sku = sku
    if (supplierId) where.supplierId = Number(supplierId)

    const priceBooks = await PriceBook.findAll({
      where,
      include: [supplierInclude],
      order: [['version', 'DESC']],
    })
    res.status(200).json({ success: true, items: priceBooks, data: priceBooks })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const deletePriceBook = async (req, res) => {
  try {
    const itemToDelete = await PriceBook.findByPk(req.params.id)
    if (!itemToDelete) return res.status(404).json({ error: 'Item not found' })

    const { sku, version, supplierId } = itemToDelete
    const allVersions = await PriceBook.findAll({
      where: { supplierId, sku, id: { [Op.ne]: itemToDelete.id } },
      order: [['version', 'DESC']],
    })

    if (allVersions.length > 0) {
      const deletedVersionNum = parseInt(String(version).replace('v', ''), 10) || 0
      const previousVersion = allVersions.find((v) => {
        const vNum = parseInt(String(v.version).replace('v', ''), 10) || 0
        return vNum < deletedVersionNum
      })
      if (previousVersion) {
        await PriceBook.update(
          { status: 'active', versionEndDate: null },
          { where: { id: previousVersion.id } }
        )
      }
    }

    await PriceBook.destroy({ where: { id: req.params.id } })
    res.status(200).json({ message: 'Item deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
