import db from '../../models/index.js'
import { Op } from 'sequelize'
import {
  searchCatalog,
  getPriceAtQty,
  extractCatalogLinesFromProject,
} from '../../service/catalogService.js'

const { ProjectSetup, ProjectMaterial, ProjectCostSheet, Suppliers, Inventory, PriceBook, InventoryCategory } = db

const materialIncludes = [
  { model: Suppliers, as: 'supplier', attributes: ['id', 'name'] },
  { model: PriceBook, as: 'priceBook', attributes: ['id', 'sku', 'name', 'unit', 'basePrice', 'version'] },
  {
    model: Inventory,
    as: 'inventory',
    attributes: ['id', 'name', 'quantity', 'costPrice'],
    include: [{ model: InventoryCategory, as: 'inventoryCategory', attributes: ['name'] }],
  },
]

export const catalogSearch = async (req, res) => {
  try {
    const { supplierId, q, source = 'all', version, limit } = req.query
    const data = await searchCatalog(db, { supplierId, q, source, version, limit })
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const priceAtQty = async (req, res) => {
  try {
    const supplierId = Number(req.params.supplierId)
    const sku = decodeURIComponent(req.params.sku || '')
    const qty = req.query.qty
    const version = req.query.version
    if (!supplierId || !sku) {
      return res.status(400).json({ success: false, error: 'supplierId and sku are required' })
    }
    const result = await getPriceAtQty(db, supplierId, sku, qty, version)
    if (!result) return res.status(404).json({ success: false, error: 'SKU not found in active pricebook' })
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getPoDraftFromProject = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId)
    const project = await ProjectSetup.findByPk(projectId, {
      include: [
        {
          model: ProjectMaterial,
          as: 'materials',
          include: materialIncludes,
        },
        { model: ProjectCostSheet, as: 'costingSheet' },
      ],
    })
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' })
    }

    const catalogLines = extractCatalogLinesFromProject(project.toJSON())
    const draftBySupplier = {}

    for (const line of catalogLines) {
      let stockQty = 0
      let inventoryMatch = null
      if (line.sku && line.supplierId) {
        const inv = await Inventory.findOne({
          where: { supplierId: line.supplierId },
          include: [
            {
              model: PriceBook,
              as: 'priceBook',
              where: { sku: line.sku },
              required: false,
            },
          ],
        })
        if (!inv) {
          const byName = await Inventory.findOne({
            where: { supplierId: line.supplierId, name: { [Op.iLike]: line.sku } },
          })
          if (byName) {
            stockQty = Number(byName.quantity) || 0
            inventoryMatch = byName.id
          }
        } else {
          stockQty = Number(inv.quantity) || 0
          inventoryMatch = inv.id
        }
      }

      const requiredQty = line.quantity || 1
      const shortfall = Math.max(0, requiredQty - stockQty)
      if (shortfall <= 0) continue

      const sid = line.supplierId
      if (!draftBySupplier[sid]) {
        const supplier = await Suppliers.findByPk(sid, { attributes: ['id', 'name'] })
        draftBySupplier[sid] = {
          supplierId: sid,
          supplierName: supplier?.name || `Supplier ${sid}`,
          lines: [],
        }
      }

      draftBySupplier[sid].lines.push({
        ...line,
        stockQty,
        inventoryId: inventoryMatch,
        orderQty: shortfall,
        subtotal: shortfall * (line.unitPrice || 0),
      })
    }

    res.json({
      success: true,
      projectId,
      suppliers: Object.values(draftBySupplier),
      totalLines: Object.values(draftBySupplier).reduce((n, s) => n + s.lines.length, 0),
    })
  } catch (error) {
    console.error('PO draft error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
}

export { materialIncludes }
