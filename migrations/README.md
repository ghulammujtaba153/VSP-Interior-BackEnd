# Database Migrations

This folder contains SQL migration scripts that can be run manually on your database.

## Available Migrations

### 1. Add Unique Constraint for PriceBook Categories
**File:** `add_unique_constraint_pricebook_category.sql`

**Purpose:** Ensures that no duplicate categories with the same name and version can exist for a supplier.

**When to run:** 
- If you're upgrading from a version without this constraint
- If Sequelize doesn't auto-create the constraint on sync

**How to run:**
```bash
# Connect to your PostgreSQL database
psql -U your_username -d your_database_name

# Run the migration
\i server/migrations/add_unique_constraint_pricebook_category.sql
```

**Or using a GUI tool:**
- Copy the SQL content from the migration file
- Paste and execute it in your database management tool (pgAdmin, DBeaver, etc.)

## Notes

- The migration script will first remove any existing duplicates (keeping the oldest entry)
- A unique constraint will be added to prevent future duplicates
- If using Sequelize auto-sync, the constraint should be created automatically when the server restarts
- Manual migration is only needed if auto-sync doesn't apply the constraint

## Rollback

To remove the constraint if needed:
```sql
ALTER TABLE "PriceBookCategory" 
DROP CONSTRAINT IF EXISTS unique_category_name_supplier_version;
```

