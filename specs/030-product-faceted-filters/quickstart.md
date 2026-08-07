# Quickstart: Faceted Product Listing Filters

**Feature**: 030-product-faceted-filters
**Date**: 2026-08-06

## Prerequisites

- [ ] Dev server running (`vercel dev` on port 3000; check `lsof -ti:3000` first, reuse if already running)
- [ ] `.env.local` configured with `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_CHANNEL_ID`
- [ ] Square catalog has products with subcategories, a brand custom attribute, and location/stock data
- [ ] TypeScript compiles cleanly: `tsc --noEmit`
- [ ] Lint passes: `npm run lint`

## Validation Scenarios

### VS-1: Listing data includes brand and availability

```bash
# Fetch a category product list (replace slug with a real top-level category)
curl -s "http://localhost:3000/api/catalog/products?slug=miniatures" | jq '.products[0] | {title, brand, availability}'
```

**Expected**: Each product includes `brand` (string or null) and `availability` (`"IN_STOCK"` or `"OUT_OF_STOCK"`). See [contracts/api.md](./contracts/api.md).

### VS-2: Subcategory facet filters the list

1. Navigate to `http://localhost:3000/shop/miniatures` (or a real category).
2. In the subcategory facet, select a subcategory (e.g., "Paints").
3. **Expected**: The product grid shows only products in that subcategory; the results count updates; the URL gains `?sub=paints`.

### VS-3: Brand facet filters the list (multi-select)

1. On the category listing page, select a brand in the Brand facet.
2. **Expected**: Only products with that brand remain.
3. Select a second brand.
4. **Expected**: Products matching either selected brand appear (OR within group).

### VS-4: Availability facet filters the list

1. Select "In Stock" in the Availability facet.
2. **Expected**: Only in-stock products are shown (a product is in stock if any of its variations is available).
3. Select "Out of Stock" (if applicable).
4. **Expected**: Only out-of-stock products are shown.

### VS-5: Facet options dynamically narrow

1. Apply a subcategory or brand filter.
2. **Expected**: The other facet groups (brand, availability, and for a brand filter, the remaining facets) narrow to only values present among the currently filtered products.

### VS-6: Active-filter count and clear-all

1. Apply several filters.
2. **Expected**: The active-filter count (e.g., the "Active: N" badge on small screens) equals the number of selected options.
3. Clear all filters.
4. **Expected**: The full category product list is restored and the count returns to 0.

### VS-7: Responsive layouts

1. At a **large** width: filters appear in a persistent left sidebar beside the grid.
2. At a **medium** width: filters appear as a horizontal strip above the grid (category chips + brand/availability).
3. At a **small** width: a "Filter & Categories" toggle with an active-count badge is shown; category filters appear as chips.

See [data-model.md](./data-model.md) for the facet state model and [contracts/api.md](./contracts/api.md) for the URL filter contract.

## Automated Tests

- **Unit**: `npm test` — tests for brand/availability extraction in `lib/square/catalog.ts`, and facet composition/narrowing logic.
- **Integration**: `npm test` — facet component tests (RTL + MSW) covering subcategory/brand/availability filtering, dynamic narrowing, active-count, and clear-all.
- **E2E**: `npm run test:e2e` — category browse journey exercising facet filtering at a critical-path level.

## Definition of Done

- `tsc --noEmit` passes; `npm run lint` passes with zero errors.
- Brand and availability surface in the listing data (VS-1).
- All three facets filter the list and narrow dynamically (VS-2–VS-5).
- Active-filter count and clear-all work (VS-6).
- Responsive layouts render at lg/md/sm (VS-7).
- Every `@US{N}` scenario in `features/product-faceted-filters.feature` has a corresponding integration or E2E test.