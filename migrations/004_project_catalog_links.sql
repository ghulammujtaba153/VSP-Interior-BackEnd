-- Project form catalog links (pricebook + inventory)

ALTER TABLE project_materials ADD COLUMN IF NOT EXISTS "sourceType" VARCHAR(32) DEFAULT 'manual';
ALTER TABLE project_materials ADD COLUMN IF NOT EXISTS "priceBookId" INTEGER REFERENCES "priceBooks"(id) ON DELETE SET NULL;
ALTER TABLE project_materials ADD COLUMN IF NOT EXISTS "inventoryId" INTEGER REFERENCES inventory_items(id) ON DELETE SET NULL;
ALTER TABLE project_materials ADD COLUMN IF NOT EXISTS sku VARCHAR(255);
ALTER TABLE project_materials ADD COLUMN IF NOT EXISTS unit VARCHAR(64);
ALTER TABLE project_materials ADD COLUMN IF NOT EXISTS quantity DECIMAL(12,4);
ALTER TABLE project_materials ADD COLUMN IF NOT EXISTS "quotedUnitPrice" DECIMAL(12,4);

ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS "priceBookId" INTEGER REFERENCES "priceBooks"(id) ON DELETE SET NULL;
