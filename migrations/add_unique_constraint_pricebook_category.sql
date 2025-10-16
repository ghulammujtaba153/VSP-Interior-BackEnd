-- Migration: Add unique constraint for PriceBookCategory
-- This ensures no duplicate categories with the same name and version can exist for a supplier
-- Run this manually on your database if the constraint doesn't auto-create

-- First, remove any duplicate entries (keeping the oldest one)
DELETE FROM "PriceBookCategory" a
USING "PriceBookCategory" b
WHERE a.id > b.id
  AND a.name = b.name
  AND a."supplierId" = b."supplierId"
  AND a.version = b.version;

-- Add the unique constraint
ALTER TABLE "PriceBookCategory"
ADD CONSTRAINT unique_category_name_supplier_version 
UNIQUE (name, "supplierId", version);

-- Verify the constraint was added
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = '"PriceBookCategory"'::regclass
  AND conname = 'unique_category_name_supplier_version';

