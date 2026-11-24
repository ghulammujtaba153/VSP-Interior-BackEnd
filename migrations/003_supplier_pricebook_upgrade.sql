-- Supplier pricebook ERP upgrade

CREATE TABLE IF NOT EXISTS price_book_imports (
  id SERIAL PRIMARY KEY,
  "supplierId" INTEGER NOT NULL REFERENCES "Suppliers"(id) ON DELETE CASCADE,
  "fileName" VARCHAR(512) NOT NULL,
  "formatKey" VARCHAR(64),
  version VARCHAR(32) NOT NULL DEFAULT 'v1',
  status VARCHAR(32) NOT NULL DEFAULT 'processing',
  "importedById" INTEGER REFERENCES users(id),
  "rowCount" INTEGER DEFAULT 0,
  "insertedCount" INTEGER DEFAULT 0,
  "updatedCount" INTEGER DEFAULT 0,
  "skippedCount" INTEGER DEFAULT 0,
  "errorLog" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS sku VARCHAR(255);
ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS category VARCHAR(255);
ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS unit VARCHAR(64);
ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS "basePrice" DECIMAL(12,4);
ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS "priceTiers" JSONB DEFAULT '[]';
ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}';
ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS currency VARCHAR(8) DEFAULT 'NZD';
ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS "importBatchId" INTEGER REFERENCES price_book_imports(id);
ALTER TABLE "priceBooks" ADD COLUMN IF NOT EXISTS "sourceFileName" VARCHAR(512);

-- Backfill sku from name for legacy rows
UPDATE "priceBooks"
SET sku = COALESCE(NULLIF(TRIM(sku), ''), NULLIF(TRIM(name), ''), 'item-' || id::text)
WHERE sku IS NULL OR TRIM(sku) = '';

DROP INDEX IF EXISTS unique_pricebook_name_version;
DROP INDEX IF EXISTS unique_pricebook_supplier_sku_version;

-- De-duplicate before composite unique index (legacy name-only rows)
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY "supplierId", sku, version ORDER BY id) AS rn
  FROM "priceBooks"
  WHERE sku IS NOT NULL AND TRIM(sku) <> ''
)
UPDATE "priceBooks" p
SET sku = LEFT(p.sku, 240) || '-' || p.id::text
FROM ranked r
WHERE p.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS unique_pricebook_supplier_sku_version
  ON "priceBooks" ("supplierId", sku, version);
