/**
 * Pre-sync patches for HR tables where Sequelize alter cannot safely
 * convert VARCHAR status columns to PostgreSQL ENUMs (default cast error).
 */

async function getColumnMeta(sequelize, table, column) {
  const [rows] = await sequelize.query(
    `
    SELECT data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = :table
      AND column_name = :column
    `,
    { replacements: { table, column } }
  )
  return rows[0] || null
}

async function tableExists(sequelize, table) {
  const [rows] = await sequelize.query(
    `
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = :table
    `,
    { replacements: { table } }
  )
  return rows.length > 0
}

async function migrateVarcharToEnum(sequelize, { table, column, enumName, values, defaultValue }) {
  if (!(await tableExists(sequelize, table))) {
    return
  }

  const col = await getColumnMeta(sequelize, table, column)
  if (!col) {
    return
  }

  if (col.data_type === 'USER-DEFINED' && col.udt_name === enumName) {
    return
  }

  if (col.data_type !== 'character varying' && col.data_type !== 'text') {
    return
  }

  const valueList = values.map((v) => `'${v}'`).join(', ')
  const inList = values.map((v) => `'${v}'`).join(', ')

  await sequelize.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT`)

  await sequelize.query(`
    UPDATE "${table}"
    SET "${column}" = LOWER(TRIM("${column}"::text))
    WHERE "${column}" IS NOT NULL
  `)

  await sequelize.query(`
    UPDATE "${table}"
    SET "${column}" = '${defaultValue}'
    WHERE "${column}" IS NULL OR "${column}" NOT IN (${inList})
  `)

  await sequelize.query(`
    DO $$ BEGIN
      CREATE TYPE "${enumName}" AS ENUM (${valueList});
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `)

  await sequelize.query(`
    ALTER TABLE "${table}"
    ALTER COLUMN "${column}" TYPE "${enumName}"
    USING ("${column}"::text::"${enumName}")
  `)

  await sequelize.query(`
    ALTER TABLE "${table}"
    ALTER COLUMN "${column}" SET DEFAULT '${defaultValue}'::"${enumName}"
  `)

  await sequelize.query(`
    ALTER TABLE "${table}" ALTER COLUMN "${column}" SET NOT NULL
  `)

  console.log(`✅ Patched ${table}.${column} → ${enumName}`)
}

/** Pricebook ERP: drop legacy global (name, version) unique index; ensure new columns exist. */
export async function runPricebookSchemaPatches(sequelize) {
  if (!(await tableExists(sequelize, 'priceBooks'))) {
    return
  }

  await sequelize.query(`
    ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS sku VARCHAR(255);
    ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS category VARCHAR(255);
    ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS unit VARCHAR(64);
    ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS "basePrice" DECIMAL(12,4);
    ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS "priceTiers" JSONB DEFAULT '[]';
    ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}';
    ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS currency VARCHAR(8) DEFAULT 'NZD';
    ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS "sourceFileName" VARCHAR(512);
  `)

  await sequelize.query(`
    UPDATE "priceBooks"
    SET sku = COALESCE(NULLIF(TRIM(sku), ''), NULLIF(TRIM(name), ''), 'item-' || id::text)
    WHERE sku IS NULL OR TRIM(sku) = '';
  `)

  await sequelize.query(`DROP INDEX IF EXISTS unique_pricebook_name_version`)
  await sequelize.query(`DROP INDEX IF EXISTS unique_pricebook_supplier_sku_version`)

  // Legacy rows often share name as sku — suffix duplicates so the composite unique index can be created
  await sequelize.query(`
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY "supplierId", sku, version
          ORDER BY id
        ) AS rn
      FROM "priceBooks"
      WHERE sku IS NOT NULL AND TRIM(sku) <> ''
    )
    UPDATE "priceBooks" p
    SET sku = LEFT(p.sku, 240) || '-' || p.id::text
    FROM ranked r
    WHERE p.id = r.id AND r.rn > 1;
  `)

  try {
    await sequelize.query(`
      CREATE UNIQUE INDEX unique_pricebook_supplier_sku_version
        ON "priceBooks" ("supplierId", sku, version)
    `)
  } catch (err) {
    if (err?.original?.code === '23505' || err?.name === 'SequelizeUniqueConstraintError') {
      console.warn(
        '⚠️ Pricebook duplicate (supplierId, sku, version) rows remain; suffixing by id and retrying index'
      )
      await sequelize.query(`
        UPDATE "priceBooks" p
        SET sku = LEFT(COALESCE(p.sku, 'item'), 240) || '-' || p.id::text
        WHERE EXISTS (
          SELECT 1 FROM "priceBooks" d
          WHERE d."supplierId" = p."supplierId"
            AND d.sku = p.sku
            AND d.version = p.version
            AND d.id <> p.id
        )
      `)
      await sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS unique_pricebook_supplier_sku_version
          ON "priceBooks" ("supplierId", sku, version)
      `)
    } else {
      throw err
    }
  }

  if (!(await tableExists(sequelize, 'price_book_imports'))) {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS price_book_imports (
        id SERIAL PRIMARY KEY,
        "supplierId" INTEGER NOT NULL REFERENCES "Suppliers"(id) ON DELETE CASCADE,
        "fileName" VARCHAR(512) NOT NULL,
        "formatKey" VARCHAR(64),
        version VARCHAR(32) NOT NULL DEFAULT 'v1',
        status VARCHAR(32) NOT NULL DEFAULT 'processing',
        "importedById" INTEGER REFERENCES "Users"(id),
        "rowCount" INTEGER DEFAULT 0,
        "insertedCount" INTEGER DEFAULT 0,
        "updatedCount" INTEGER DEFAULT 0,
        "skippedCount" INTEGER DEFAULT 0,
        "errorLog" JSONB,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
  }

  await sequelize.query(`
    ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS "importBatchId" INTEGER REFERENCES price_book_imports(id);
  `)

  console.log('✅ Pricebook schema patches applied')
}

/** Project form catalog links on project_materials + inventory.priceBookId */
export async function runProjectCatalogSchemaPatches(sequelize) {
  if (!(await tableExists(sequelize, 'project_materials'))) {
    return
  }

  await sequelize.query(`
    ALTER TABLE project_materials ADD COLUMN IF NOT EXISTS "sourceType" VARCHAR(32) DEFAULT 'manual';
    ALTER TABLE project_materials ADD COLUMN IF NOT EXISTS "priceBookId" INTEGER REFERENCES "priceBooks"(id) ON DELETE SET NULL;
    ALTER TABLE project_materials ADD COLUMN IF NOT EXISTS "inventoryId" INTEGER REFERENCES inventory_items(id) ON DELETE SET NULL;
    ALTER TABLE project_materials ADD COLUMN IF NOT EXISTS sku VARCHAR(255);
    ALTER TABLE project_materials ADD COLUMN IF NOT EXISTS unit VARCHAR(64);
    ALTER TABLE project_materials ADD COLUMN IF NOT EXISTS quantity DECIMAL(12,4);
    ALTER TABLE project_materials ADD COLUMN IF NOT EXISTS "quotedUnitPrice" DECIMAL(12,4);
  `)

  if (await tableExists(sequelize, 'inventory_items')) {
    await sequelize.query(`
      ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS "priceBookId" INTEGER REFERENCES "priceBooks"(id) ON DELETE SET NULL;
    `)
  }

  console.log('✅ Project catalog schema patches applied')
}

export async function runHrSchemaPatches(sequelize) {
  await migrateVarcharToEnum(sequelize, {
    table: 'employee_leaves',
    column: 'status',
    enumName: 'enum_employee_leaves_status',
    values: ['pending', 'approved', 'rejected', 'cancelled'],
    defaultValue: 'pending',
  })

  await migrateVarcharToEnum(sequelize, {
    table: 'employee_timesheets',
    column: 'status',
    enumName: 'enum_employee_timesheets_status',
    values: ['draft', 'submitted', 'pending', 'approved', 'rejected', 'locked'],
    defaultValue: 'draft',
  })
}
