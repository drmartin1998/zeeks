# Quickstart: Subcategory Filtering on Category Pages

**Feature**: 008-subcategory-filtering | **Date**: 2026-08-02

## Prerequisites

- Node.js 20+
- Square sandbox credentials configured in `.env.local`:
  - `SQUARE_ACCESS_TOKEN`
  - `SQUARE_LOCATION_ID`
  - `SQUARE_ENVIRONMENT=sandbox`
- Dev server running (`vercel dev` on port 3000)
- `npm test` passing with zero failures

## Validation Scenarios

### VS-1: Category page loads with unified products (FR-001)

```bash
curl -s http://localhost:3000/categories/miniatures | grep -c "game-card"
```
**Expected**: Returns a count > 0. The HTML should contain product cards for both parent category items and subcategory items.

### VS-2: Subcategory filter chips render (FR-002)

```bash
curl -s http://localhost:3000/categories/miniatures | grep -o "subcategory-chip\|All" | head -5
```
**Expected**: If the category has subcategories, chip labels appear in the HTML. If no subcategories exist, only "All" or no chips appear.

### VS-3: Filter chip click narrows products (FR-004) — client-side

1. Open `http://localhost:3000/categories/miniatures` in a browser.
2. Note the product count (all products visible).
3. Click a subcategory chip.
4. **Expected**: Only products matching that subcategory remain visible. Product count decreases or stays the same. No page reload occurs (client-side filtering).

### VS-4: URL reflects active filter (FR-007)

1. Navigate to `http://localhost:3000/categories/miniatures`.
2. Click a subcategory chip.
3. **Expected**: Browser URL updates to `http://localhost:3000/categories/miniatures?sub=<slug>`.
4. Copy the URL, open in a new tab.
5. **Expected**: The same subcategory filter is active on load.

### VS-5: Zero-results state (FR-008)

1. Manually set a URL with a subcategory that has no products: `?sub=<empty-sub-slug>`.
2. **Expected**: A message "No products in this subcategory" is displayed with a "Show all" button. Clicking "Show all" clears the filter and shows all products.

### VS-6: Pagination (FR-009)

1. Navigate to a category with > 12 products.
2. **Expected**: Only 12 products displayed. Pagination controls (page numbers) appear below the grid.
3. Click page 2.
4. **Expected**: Next 12 products displayed, page scrolls to top.

### VS-7: 404 for unknown category (FR-012)

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/categories/nonexistent-slug-12345
```
**Expected**: HTTP `404`.

### VS-8: No mock data served on error (FR-011, FR-012)

1. Temporarily set `SQUARE_ACCESS_TOKEN=invalid` in `.env.local`.
2. Restart `vercel dev`.
3. Navigate to `http://localhost:3000/categories/miniatures`.
4. **Expected**: An error banner or message is displayed. No product cards from mock data appear.

## Quality Gate Commands

```bash
# TypeScript check
tsc --noEmit

# Lint check
npm run lint

# Unit + Integration tests
npm test

# E2E tests (requires dev server)
npm run test:e2e
```

All commands must return zero errors before merge.
