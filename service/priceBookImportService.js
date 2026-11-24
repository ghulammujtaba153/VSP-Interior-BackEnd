import XLSX from 'xlsx'
import { FORMAT_PROFILES } from '../config/priceBookFormats.js'

export function normalizeHeader(h) {
  return String(h || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function parsePrice(val) {
  if (val == null || val === '') return null
  const n = parseFloat(String(val).replace(/[$,\s]/g, ''))
  return Number.isFinite(n) ? n : null
}

export function parseQtyRange(raw) {
  if (raw == null || raw === '') return { minQty: 1, maxQty: null }
  const s = String(raw).trim()
  if (s.includes('-')) {
    const [a, b] = s.split('-').map((x) => parseInt(x.replace(/\D/g, ''), 10))
    return { minQty: a || 1, maxQty: b || null }
  }
  if (s.endsWith('+')) {
    const n = parseInt(s.replace(/\D/g, ''), 10)
    return { minQty: n || 1, maxQty: null }
  }
  const n = parseInt(s.replace(/\D/g, ''), 10)
  if (Number.isFinite(n)) return { minQty: n, maxQty: n }
  return { minQty: 1, maxQty: null }
}

export function sheetToRows(buffer, filename = '') {
  const bookType = filename.toLowerCase().endsWith('.csv') ? 'string' : 'buffer'
  const data = bookType === 'string' ? buffer.toString('utf8') : buffer
  const workbook = XLSX.read(data, { type: bookType, cellDates: false })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })
}

export function rowsWithNormalizedKeys(rows) {
  return rows.map((row) => {
    const out = {}
    for (const [k, v] of Object.entries(row)) {
      out[normalizeHeader(k)] = v
    }
    return out
  })
}

export function detectFormatFromRows(rows) {
  if (!rows.length) return 'custom'
  const headers = Object.keys(rows[0]).map(normalizeHeader)
  for (const [key, profile] of Object.entries(FORMAT_PROFILES)) {
    if (profile.detect(headers)) return key
  }
  return 'custom'
}

function getCol(row, ...candidates) {
  for (const c of candidates) {
    const key = normalizeHeader(c)
    if (row[key] !== undefined && row[key] !== '') return row[key]
  }
  for (const k of Object.keys(row)) {
    for (const c of candidates) {
      if (k.includes(normalizeHeader(c))) return row[k]
    }
  }
  return ''
}

function findPriceColumnKey(row) {
  const keys = Object.keys(row)
  const priceKey = keys.find((k) => k.includes('price') || k.includes('p3 40') || k.includes('2026'))
  if (priceKey) return priceKey
  return keys[keys.length - 1]
}

function parseEnkoRows(rows) {
  const tierRows = []
  for (const row of rows) {
    const sku = String(getCol(row, 'Product Code', 'product code')).trim()
    if (!sku) continue
    const qty = parseInt(getCol(row, 'Quantity', 'quantity'), 10) || 1
    const price = parsePrice(getCol(row, 'Wholesale 3 Rate', 'wholesale'))
    tierRows.push({
      sku,
      name: String(getCol(row, 'Product Description', 'description')).trim() || sku,
      description: String(getCol(row, 'Product Description', 'description')).trim(),
      category: String(getCol(row, 'Product Group', 'group')).trim(),
      unit: String(getCol(row, 'Unit of Measure', 'measure', 'uom')).trim(),
      tier: { minQty: qty, maxQty: qty, price },
    })
  }
  return mergeTierRows(tierRows)
}

function parseVspTieredRows(rows) {
  const items = []
  for (const row of rows) {
    const sku = String(getCol(row, 'Item', 'item')).trim()
    if (!sku) continue
    const keys = Object.keys(row)
    const qtyKeys = keys.filter((k) => k.includes('qty range'))
    const priceKeys = keys.filter((k) => k.includes('unit price') || (k.includes('price') && !k.includes('qty')))
    const tiers = []
    for (let i = 0; i < Math.max(qtyKeys.length, priceKeys.length); i++) {
      const range = parseQtyRange(row[qtyKeys[i]])
      const price = parsePrice(row[priceKeys[i]])
      if (price != null) {
        tiers.push({ minQty: range.minQty, maxQty: range.maxQty, price })
      }
    }
    if (tiers.length === 0) {
      const price = parsePrice(getCol(row, 'Unit Price', 'price'))
      if (price != null) tiers.push({ minQty: 1, maxQty: null, price })
    }
    items.push({
      sku,
      name: sku,
      description: String(getCol(row, 'Description', 'description')).trim(),
      category: String(getCol(row, 'Class', 'class')).trim(),
      unit: 'Each',
      priceTiers: tiers,
      basePrice: tiers[0]?.price ?? null,
    })
  }
  return items
}

function parsePspRows(rows) {
  const items = []
  for (const row of rows) {
    const sku = String(getCol(row, 'SKU', 'sku')).trim()
    if (!sku) continue
    const price = parsePrice(getCol(row, 'PRICE', 'price'))
    items.push({
      sku,
      name: sku,
      description: String(getCol(row, 'Description', 'description')).trim(),
      category: '',
      unit: 'Sheet',
      priceTiers: price != null ? [{ minQty: 1, maxQty: null, price }] : [],
      basePrice: price,
    })
  }
  return items
}

function parseP3Rows(rows) {
  const items = []
  for (const row of rows) {
    const art = String(getCol(row, 'Art#', 'art')).trim()
    if (!art) continue
    const size = String(getCol(row, 'Size', 'size')).trim()
    const sku = size ? `${art}-${size}` : art
    const priceKey = findPriceColumnKey(row)
    const price = parsePrice(row[priceKey])
    items.push({
      sku,
      name: String(getCol(row, 'Description', 'description')).trim() || sku,
      description: String(getCol(row, 'Description', 'description')).trim(),
      category: 'Cabinet Hardware',
      unit: 'Each',
      attributes: {
        artNumber: art,
        size,
        colour: String(getCol(row, 'Colour/Finish', 'colour', 'finish')).trim(),
      },
      priceTiers: price != null ? [{ minQty: 1, maxQty: null, price }] : [],
      basePrice: price,
    })
  }
  return items
}

function parseVspintRows(rows) {
  const items = []
  for (const row of rows) {
    const sku = String(getCol(row, 'Product', 'product')).trim()
    if (!sku) continue
    const price = parsePrice(getCol(row, 'Net Price', 'net price', 'price'))
    items.push({
      sku,
      name: sku,
      description: String(getCol(row, 'HFL PRODUCT DESCRIPTION', 'description')).trim(),
      category: 'Fasteners',
      unit: 'Pack',
      priceTiers: price != null ? [{ minQty: 1, maxQty: null, price }] : [],
      basePrice: price,
    })
  }
  return items
}

function mergeTierRows(tierRows) {
  const bySku = new Map()
  for (const r of tierRows) {
    if (!bySku.has(r.sku)) {
      bySku.set(r.sku, {
        sku: r.sku,
        name: r.name,
        description: r.description,
        category: r.category,
        unit: r.unit,
        priceTiers: [],
      })
    }
    const item = bySku.get(r.sku)
    if (r.tier?.price != null) {
      item.priceTiers.push({
        minQty: r.tier.minQty,
        maxQty: r.tier.maxQty,
        price: r.tier.price,
      })
    }
  }
  return Array.from(bySku.values()).map((item) => {
    item.priceTiers.sort((a, b) => a.minQty - b.minQty)
    item.basePrice = item.priceTiers[0]?.price ?? null
    return item
  })
}

export function parseRowsToItems(rows, formatKey) {
  const normalized = rowsWithNormalizedKeys(rows)
  switch (formatKey) {
    case 'enko_wholesale':
      return parseEnkoRows(normalized)
    case 'vsp_tiered':
      return parseVspTieredRows(normalized)
    case 'psp_simple':
      return parsePspRows(normalized)
    case 'p3_hardware':
      return parseP3Rows(normalized)
    case 'vspint_simple':
      return parseVspintRows(normalized)
    default:
      return parsePspRows(normalized)
  }
}

export function previewImport(buffer, filename, formatKey = null) {
  const warnings = []
  const errors = []
  let rows
  try {
    rows = sheetToRows(buffer, filename)
  } catch (e) {
    return { items: [], warnings, errors: [e.message], stats: { totalRows: 0, itemCount: 0 }, formatKey: 'custom' }
  }

  if (!rows.length) {
    return { items: [], warnings, errors: ['File is empty'], stats: { totalRows: 0, itemCount: 0 }, formatKey: 'custom' }
  }

  const detected = formatKey || detectFormatFromRows(rowsWithNormalizedKeys(rows))
  if (!formatKey && detected === 'custom') {
    warnings.push('Could not auto-detect format; attempted simple SKU/Description/PRICE mapping')
  }

  let items = []
  try {
    items = parseRowsToItems(rows, detected)
  } catch (e) {
    errors.push(e.message)
  }

  const withoutPrice = items.filter((i) => i.basePrice == null && (!i.priceTiers || !i.priceTiers.length))
  if (withoutPrice.length) {
    warnings.push(`${withoutPrice.length} item(s) have no price`)
  }

  return {
    items,
    warnings,
    errors,
    formatKey: detected,
    stats: {
      totalRows: rows.length,
      itemCount: items.length,
    },
  }
}

export function nextVersion(existingVersions = []) {
  if (!existingVersions.length) return 'v1'
  const nums = existingVersions
    .map((v) => parseInt(String(v).replace(/^v/i, ''), 10))
    .filter((n) => Number.isFinite(n))
  const max = nums.length ? Math.max(...nums) : 0
  return `v${max + 1}`
}
