-- Migration: Add unique constraint for PriceBook items
-- This ensures each version of an item is handled separately
-- Same item name can exist in different versions, but not within the same version

-- First, remove any duplicate entries (keeping the oldest one)
-- Duplicates are: same name + same category + same version
DELETE FROM "priceBooks" a
USING "priceBooks" b
WHERE a.id > b.id
  AND a.name = b.name
  AND a."priceBookCategoryId" = b."priceBookCategoryId"
  AND a.version = b.version;

-- Add the unique constraint
ALTER TABLE "priceBooks"
ADD CONSTRAINT unique_pricebook_name_category_version 
UNIQUE (name, "priceBookCategoryId", version);

-- Verify the constraint was added
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    conkey AS column_indexes
FROM pg_constraint
WHERE conrelid = '"priceBooks"'::regclass
  AND conname = 'unique_pricebook_name_category_version';

-- Query to see which columns are in the constraint
SELECT 
    c.conname AS constraint_name,
    a.attname AS column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE c.conrelid = '"priceBooks"'::regclass
  AND c.conname = 'unique_pricebook_name_category_version'
ORDER BY a.attnum;

