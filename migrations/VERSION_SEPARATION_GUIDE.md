# Price Book Version Separation Guide

## Overview
Each price book item version is handled completely separately. This means the same item name can exist in multiple versions, each with independent pricing, status, and properties.

## Database Schema

### Unique Constraint
```sql
UNIQUE (name, priceBookCategoryId, version)
```

This ensures:
- ✅ Same item name can exist in **different versions**
- ✅ Same item name can exist in **different categories**
- ❌ Same item name **cannot** exist twice in the **same category + same version**

## How Versions Are Separated

### 1. Storage Level (Database)
Each version is stored as a completely separate row in the database:

```
priceBooks Table:
┌────┬──────────────┬────────────┬─────────┬────────┬─────────┬────────┐
│ id │     name     │ categoryId │  unit   │ price  │ version │ status │
├────┼──────────────┼────────────┼─────────┼────────┼─────────┼────────┤
│ 1  │ Oak Wood     │     5      │ piece   │ 25.00  │   v1    │ active │
│ 2  │ Oak Wood     │     5      │ piece   │ 28.00  │   v2    │ active │
│ 3  │ Oak Wood     │     5      │ piece   │ 30.00  │   v3    │ active │
│ 4  │ Pine Board   │     5      │ piece   │ 15.00  │   v1    │ active │
│ 5  │ Pine Board   │     5      │ piece   │ 17.00  │   v2    │ active │
└────┴──────────────┴────────────┴─────────┴────────┴─────────┴────────┘
```

### 2. Application Level (Backend)

**Create Validation:**
```javascript
// Check for duplicate: name + category + version
const existingItem = await PriceBook.findOne({
    where: {
        name: name,
        priceBookCategoryId: categoryId,
        version: version
    }
});

if (existingItem) {
    return error("Item already exists in this version");
}
```

**Update Validation:**
```javascript
// When changing name or version, check for conflicts
// Excludes current item from duplicate check
const existingItem = await PriceBook.findOne({
    where: {
        name: newName,
        priceBookCategoryId: categoryId,
        version: newVersion
    }
});

if (existingItem && existingItem.id !== currentItemId) {
    return error("Item already exists in this version");
}
```

### 3. Frontend Level

**Version Selection Dialog:**
- User can choose to create a new version OR update existing version
- Duplicate check happens before save
- Clear error messages guide the user

## Use Cases

### Use Case 1: Price Increase (New Version)
**Scenario:** Supplier increases oak wood price from $25 to $28

**Action:**
1. Edit "Oak Wood" item
2. Update price to $28
3. Select "Create New Version"
4. System creates v2

**Result:**
```
Oak Wood v1: $25.00 (used by old tenders/quotes)
Oak Wood v2: $28.00 (used by new tenders/quotes)
```

### Use Case 2: Adding New Items to Existing Version
**Scenario:** Adding a new item "Maple Wood" to existing v1

**Action:**
1. Click "Add Item"
2. Enter name: "Maple Wood"
3. Select "Update Existing Version" → v1
4. System adds to v1

**Result:**
```
v1:
  - Oak Wood: $25.00
  - Pine Board: $15.00
  - Maple Wood: $20.00 ← New item in v1
```

### Use Case 3: Bulk Import with Version
**Scenario:** Importing 100 items from Excel

**Action:**
1. Upload Excel file
2. Select version: "Create New Version"
3. System creates v3 for all items

**Result:**
```
All 100 items stored with version = v3
Categories reused, items are separate
```

### Use Case 4: Moving Item to Different Version
**Scenario:** Change "Oak Wood" from v1 to v2

**Action:**
1. Edit "Oak Wood v1"
2. Change version to v2
3. System validates no duplicate exists

**Result:**
```
Before: Oak Wood v1 exists
After: Oak Wood v2 exists (v1 deleted or updated)
```

## Duplicate Prevention Examples

### ✅ ALLOWED: Same Name, Different Versions
```javascript
Items:
- "Oak Wood" v1, Category: Wood, $25.00  ✅
- "Oak Wood" v2, Category: Wood, $28.00  ✅
- "Oak Wood" v3, Category: Wood, $30.00  ✅
```
**Why:** Different versions = separate items

### ✅ ALLOWED: Same Name, Different Categories
```javascript
Items:
- "Plank" v1, Category: Wood, $25.00     ✅
- "Plank" v1, Category: Metal, $45.00    ✅
```
**Why:** Different categories = separate items

### ❌ BLOCKED: Same Name, Same Category, Same Version
```javascript
Items:
- "Oak Wood" v1, Category: Wood, $25.00  (existing)
- "Oak Wood" v1, Category: Wood, $30.00  ❌ DUPLICATE
```
**Error:** "Item 'Oak Wood' already exists in version v1"

## Version Lifecycle

```
v1 (Initial) → Used by Tender #1, #2, #3
    ↓
v2 (Price Update) → Used by Tender #4, #5
    ↓
v3 (Major Change) → Used by Tender #6 onwards
```

**Key Point:** 
- Tender #1 will ALWAYS reference v1 pricing
- Tender #6 will ALWAYS reference v3 pricing
- No cross-contamination between versions

## API Endpoints Behavior

### POST /api/pricebook/create
```javascript
Request:
{
  name: "Oak Wood",
  priceBookCategoryId: 5,
  version: "v2",
  price: 28.00
}

Validation:
- Checks if "Oak Wood" + Category 5 + v2 exists
- If yes → Error
- If no → Create
```

### PUT /api/pricebook/update/:id
```javascript
Request:
{
  name: "Oak Wood",
  version: "v3"
}

Validation:
- Gets current item
- Checks if "Oak Wood" + current category + v3 exists
- Excludes current item from check
- If duplicate → Error
- If no duplicate → Update
```

### POST /api/pricebook/import
```javascript
Request:
{
  supplierId: 1,
  version: "v2",
  items: [...]
}

Behavior:
- All items get version: "v2"
- Categories are created/reused (no version on categories)
- Duplicate check per item: name + category + v2
- Skips duplicates, imports new items only
```

## Benefits of Version Separation

1. **Historical Data Integrity**
   - Old tenders keep their original prices
   - No data loss when updating prices

2. **Audit Trail**
   - Complete history of price changes
   - Can track when prices changed

3. **Flexibility**
   - Can have multiple price points active
   - Easy to rollback by using older version

4. **Tenant Isolation**
   - Each tender/quote is isolated to its version
   - No accidental price changes affect old quotes

5. **Bulk Operations**
   - Can import entire new price lists as new version
   - Old prices remain intact

## Testing Scenarios

### Test 1: Create Same Item in Different Versions
```bash
# Should succeed
POST /api/pricebook/create { name: "Test", category: 1, version: "v1" } → ✅
POST /api/pricebook/create { name: "Test", category: 1, version: "v2" } → ✅
POST /api/pricebook/create { name: "Test", category: 1, version: "v3" } → ✅
```

### Test 2: Create Duplicate in Same Version
```bash
# Should fail
POST /api/pricebook/create { name: "Test", category: 1, version: "v1" } → ✅
POST /api/pricebook/create { name: "Test", category: 1, version: "v1" } → ❌
```

### Test 3: Update to Existing Version
```bash
# Should fail if duplicate exists
PUT /api/pricebook/update/1 { version: "v2" } 
# Where "Test v2" already exists → ❌
```

### Test 4: Import with Duplicate Names in Different Versions
```bash
# Should succeed
POST /api/pricebook/import { version: "v1", items: [{ name: "Test" }] } → ✅
POST /api/pricebook/import { version: "v2", items: [{ name: "Test" }] } → ✅
```

## Conclusion

Versions are completely isolated at every level:
- ✅ Database constraint enforces separation
- ✅ Backend validation prevents duplicates within version
- ✅ Frontend provides clear version selection
- ✅ Each version maintains independent data
- ✅ No cross-version interference possible

