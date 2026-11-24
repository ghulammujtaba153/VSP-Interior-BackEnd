import { Op } from 'sequelize'

export function resolvePriceAtQty(priceTiers = [], basePrice, qty = 1) {
  const q = Number(qty) || 1
  const tiers = Array.isArray(priceTiers) ? [...priceTiers].sort((a, b) => a.minQty - b.minQty) : []
  if (!tiers.length) {
    return { price: basePrice != null ? Number(basePrice) : null, tier: null }
  }
  const matched =
    tiers.find((t) => {
      const min = Number(t.minQty) || 1
      const max = t.maxQty != null ? Number(t.maxQty) : null
      return q >= min && (max == null || q <= max)
    }) || tiers[tiers.length - 1]
  return {
    price: matched?.price != null ? Number(matched.price) : Number(basePrice),
    tier: matched || null,
  }
}

export function normalizePricebookRow(row, stockQty = 0) {
  const plain = row.get ? row.get({ plain: true }) : row
  return {
    source: 'pricebook',
    id: plain.id,
    priceBookId: plain.id,
    inventoryId: null,
    sku: plain.sku || plain.name,
    name: plain.name,
    description: plain.description || plain.name,
    unit: plain.unit || 'Each',
    price: plain.basePrice != null ? Number(plain.basePrice) : null,
    priceTiers: plain.priceTiers || [],
    category: plain.category,
    supplierId: plain.supplierId,
    supplierName: plain.supplier?.name || null,
    version: plain.version,
    stockQty,
  }
}

export function normalizeInventoryRow(row, priceBook = null) {
  const plain = row.get ? row.get({ plain: true }) : row
  const pb = priceBook || plain.priceBook
  return {
    source: 'inventory',
    id: plain.id,
    priceBookId: plain.priceBookId || pb?.id || null,
    inventoryId: plain.id,
    sku: pb?.sku || plain.name,
    name: plain.name,
    description: plain.description || plain.name,
    unit: pb?.unit || 'Each',
    price: plain.costPrice != null ? Number(plain.costPrice) : null,
    priceTiers: pb?.priceTiers || [],
    category: plain.inventoryCategory?.name || pb?.category || null,
    supplierId: plain.supplierId,
    supplierName: plain.supplier?.name || null,
    version: pb?.version || null,
    stockQty: plain.quantity != null ? Number(plain.quantity) : 0,
  }
}

export async function searchCatalog(db, { supplierId, q, source = 'all', version, limit = 25 }) {
  const { PriceBook, Inventory, Suppliers, InventoryCategory } = db
  const cap = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100)
  const results = []

  const stockBySku = new Map()
  if (supplierId) {
    const invRows = await Inventory.findAll({
      where: { supplierId: Number(supplierId) },
      attributes: ['id', 'quantity', 'priceBookId', 'name'],
      include: [{ model: db.PriceBook, as: 'priceBook', attributes: ['sku'] }],
      limit: 5000,
    })
    for (const inv of invRows) {
      const sku = inv.priceBook?.sku || inv.name
      if (sku) stockBySku.set(String(sku).toLowerCase(), (stockBySku.get(String(sku).toLowerCase()) || 0) + Number(inv.quantity || 0))
    }
  }

  if (source === 'pricebook' || source === 'all') {
    const pbWhere = { status: 'active' }
    if (supplierId) pbWhere.supplierId = Number(supplierId)
    if (version) pbWhere.version = version
    if (q?.trim()) {
      pbWhere[Op.or] = [
        { sku: { [Op.iLike]: `%${q}%` } },
        { name: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { category: { [Op.iLike]: `%${q}%` } },
      ]
    }
    const pbRows = await PriceBook.findAll({
      where: pbWhere,
      include: [{ model: Suppliers, as: 'supplier', attributes: ['id', 'name'] }],
      order: [['sku', 'ASC']],
      limit: cap,
    })
    for (const row of pbRows) {
      const skuKey = String(row.sku || row.name || '').toLowerCase()
      results.push(normalizePricebookRow(row, stockBySku.get(skuKey) || 0))
    }
  }

  if (source === 'inventory' || source === 'all') {
    const invWhere = {}
    if (supplierId) invWhere.supplierId = Number(supplierId)
    if (q?.trim()) {
      invWhere[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
      ]
    }
    const invRows = await Inventory.findAll({
      where: invWhere,
      include: [
        { model: Suppliers, as: 'supplier', attributes: ['id', 'name'] },
        { model: InventoryCategory, as: 'inventoryCategory', attributes: ['id', 'name'] },
        { model: db.PriceBook, as: 'priceBook', attributes: ['id', 'sku', 'unit', 'basePrice', 'priceTiers', 'version', 'category'] },
      ],
      order: [['name', 'ASC']],
      limit: cap,
    })
    for (const row of invRows) {
      results.push(normalizeInventoryRow(row))
    }
  }

  return results.slice(0, cap)
}

export async function getPriceAtQty(db, supplierId, sku, qty, version) {
  const { PriceBook } = db
  const where = {
    supplierId: Number(supplierId),
    sku,
    status: 'active',
  }
  if (version) where.version = version
  const row = await PriceBook.findOne({
    where,
    order: [['version', 'DESC']],
  })
  if (!row) return null
  const resolved = resolvePriceAtQty(row.priceTiers, row.basePrice, qty)
  return {
    sku: row.sku,
    supplierId: row.supplierId,
    version: row.version,
    priceBookId: row.id,
    qty: Number(qty) || 1,
    price: resolved.price,
    tier: resolved.tier,
    priceTiers: row.priceTiers || [],
  }
}

/** Collect catalog lines from project materials + costing sheet for PO draft */
export function extractCatalogLinesFromProject(project) {
  const lines = []
  const materials = project.materials || []
  for (const m of materials) {
    if (m.sourceType === 'inventory') continue
    if (m.sourceType === 'pricebook' || m.priceBookId || m.sku) {
      lines.push({
        sourceType: m.sourceType || 'pricebook',
        supplierId: m.supplierId,
        sku: m.sku,
        priceBookId: m.priceBookId,
        description: m.finishMaterial || m.description,
        unit: m.unit || m.measure,
        quantity: Number(m.quantity) || 1,
        unitPrice: Number(m.quotedUnitPrice ?? m.materialCost) || 0,
        section: 'materials',
      })
    }
  }

  const cs = project.costingSheet?.dataValues || project.costingSheet || {}
  const sections = [
    'hardwareLookUp', 'buyInItems', 'hinges', 'trims', 'cabinetLookUp', 'wallPanelling',
  ]
  for (const section of sections) {
    const arr = cs[section]
    if (!Array.isArray(arr)) continue
    for (const item of arr) {
      if (item.sourceType === 'inventory') continue
      if (item.sourceType === 'pricebook' || item.priceBookId || item.sku || item.code) {
        lines.push({
          sourceType: item.sourceType || (item.priceBookId ? 'pricebook' : 'manual'),
          supplierId: item.supplierId,
          sku: item.sku || item.code,
          priceBookId: item.priceBookId,
          description: item.description,
          unit: item.measure,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.mateialRate) || 0,
          section,
        })
      }
    }
  }
  return lines.filter((l) => l.sourceType === 'pricebook' && l.supplierId)
}
