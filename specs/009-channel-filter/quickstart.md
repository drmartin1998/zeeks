# Quickstart: Channel-Based Category Filtering

## Prerequisites

- Square sandbox credentials configured (`.env.local` with `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`)
- Target channel ID set in `.env.local`:
  ```
  SQUARE_CHANNEL_ID=CH_zNTh1RdktHh0AQ362Egjt0mUUB5xvj7bpZHdkc049945o
  ```
- Dev server available (check `lsof -ti:3000` first)

## Validation Scenarios

### 1. Channel filter excludes non-channel categories

```bash
# Start dev server (if not running)
vercel dev

# Check that navigation only returns channel categories
curl -s http://localhost:3000/api/catalog/categories | jq '.[].label'
```

**Expected**: Only categories whose `channels` include `CH_zNTh1RdktHh0AQ362Egjt0mUUB5xvj7bpZHdkc049945o` appear.

### 2. Missing SQUARE_CHANNEL_ID returns empty

```bash
# Temporarily unset (restore after test)
SQUARE_CHANNEL_ID="" vercel dev

# Verify no categories returned
curl -s http://localhost:3000/api/catalog/categories | jq 'length'
```

**Expected**: Returns `0` (empty array).

### 3. Category page respects channel filter

```bash
# Visit a category that IS in the channel
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/categories/miniatures
```

**Expected**: Returns `200`.

### 4. Channel-excluded category returns 404

```bash
# Visit a category NOT in the channel
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/categories/board-games
```

**Expected**: Returns `404` (category excluded by channel filter).

### 5. Subcategory dropdown shows channel-eligible subcategories

Visit `/categories/miniatures` in browser. Verify the Category dropdown shows subcategories (e.g., "Games Workshop") that belong to channel-eligible parents only.

## Test Commands

```bash
# Static checks
tsc --noEmit
npm run lint

# Unit + Integration tests
npm test

# E2E tests
npm run test:e2e
```

## Expected File Changes

| File | Change |
|------|--------|
| `lib/square/types.ts` | Add `channels?: string[]` to `categoryData` |
| `lib/square/catalog.ts` | Add channel filter in `fetchAllCategories()` |
| `lib/square/__tests__/catalog.test.ts` | Add channel filter test cases |
| `.env.local` | Add `SQUARE_CHANNEL_ID` |
