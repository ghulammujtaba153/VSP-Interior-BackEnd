/**
 * Pricebook import format tests — parses fixture CSVs from pricebook csv/
 * Usage: node tests/pricebook.import.test.js
 */
import assert from 'assert'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { previewImport } from '../service/priceBookImportService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES = path.resolve(__dirname, '../../pricebook csv')

function readFixture(name) {
  const filePath = path.join(FIXTURES, name)
  assert.ok(fs.existsSync(filePath), `Fixture missing: ${filePath}`)
  return fs.readFileSync(filePath)
}

function assertHasItems(result, minCount, formatKey) {
  assert.strictEqual(result.formatKey, formatKey, `Expected format ${formatKey}, got ${result.formatKey}`)
  assert.ok(result.items.length >= minCount, `Expected >= ${minCount} items, got ${result.items.length}`)
  assert.strictEqual(result.errors.length, 0, `Errors: ${result.errors.join('; ')}`)
}

async function run() {
  const enko = previewImport(
    readFixture('ENKO 2026 Wholesale 3 Price List as of 01.05.26 (NEW).csv'),
    'enko.csv'
  )
  assertHasItems(enko, 100, 'enko_wholesale')
  const tiered = enko.items.find((i) => i.priceTiers && i.priceTiers.length > 1)
  assert.ok(tiered, 'ENKO should collapse multi-row SKUs into tiered items')
  assert.ok(tiered.priceTiers.length >= 2, 'ENKO tiered item should have 2+ tiers')
  assert.ok(tiered.sku, 'ENKO item should have sku')
  assert.ok(tiered.basePrice != null, 'ENKO item should have basePrice')

  const vsp = previewImport(readFixture('VSP Pricelist.csv'), 'vsp.csv')
  assertHasItems(vsp, 10, 'vsp_tiered')
  const vspTiered = vsp.items.find((i) => i.priceTiers?.length >= 2)
  assert.ok(vspTiered, 'VSP should parse dual-tier columns')

  const psp = previewImport(
    readFixture('PSP Plastic Sheets Pricelist APR 2026 CSV PL1.csv'),
    'psp.csv'
  )
  assertHasItems(psp, 5, 'psp_simple')
  assert.ok(psp.items.every((i) => i.sku), 'PSP items need sku')
  const withPrice = psp.items.filter((i) => i.basePrice != null)
  assert.ok(withPrice.length >= 5, 'PSP should parse priced rows')

  const p3 = previewImport(
    readFixture('P3 40 HKCW Pricelist excel 01 04 2026.csv'),
    'p3.csv'
  )
  assertHasItems(p3, 5, 'p3_hardware')
  const p3Item = p3.items[0]
  assert.ok(p3Item.sku.includes('-') || p3Item.attributes?.artNumber, 'P3 SKU should combine Art# and Size')

  const vspint = previewImport(readFixture('VSPINT CSV.csv'), 'vspint.csv')
  assertHasItems(vspint, 5, 'vspint_simple')
  assert.ok(vspint.items[0].basePrice != null, 'VSPINT should have net price')

  console.log('Pricebook import format tests passed (5 profiles)')
  console.log(`  ENKO: ${enko.items.length} products from ${enko.stats.totalRows} rows`)
  console.log(`  VSP:  ${vsp.items.length} products`)
  console.log(`  PSP:  ${psp.items.length} products`)
  console.log(`  P3:   ${p3.items.length} products`)
  console.log(`  VSPINT: ${vspint.items.length} products`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
