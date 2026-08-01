# Research: Square Product Display

## 1. Root Cause Investigation

**Decision**: Verify Square API connectivity and catalog data before debugging rendering

**Rationale**: "Products not displaying" can be caused by: (a) Square API returning empty/no data, (b) API credentials not reaching the sandbox, (c) data-fetching functions failing silently, or (d) rendering pipeline discarding valid data. The most efficient approach is to verify at the API boundary first, then trace down through the pipeline.

**Investigation steps**:
1. Verify Square client initialization succeeds (token, environment)
2. Call `catalogApi.search()` directly to confirm categories exist
3. Call `catalogApi.searchItems()` directly to confirm items exist
4. Trace `getSquareProductsByCategorySlug()` return value in page component
5. Verify `CategoryProductGrid` receives non-empty products array

## 2. API Credential Verification

**Decision**: Check `SQUARE_ACCESS_TOKEN` and `SQUARE_ENVIRONMENT` in `lib/env.ts`

**Rationale**: If credentials are missing or environment is wrong, all Square API calls fail silently (caught by try/catch → return null). The pages then show 404 via `notFound()`.

## 3. Catalog Data Verification

**Decision**: Confirm Square sandbox has catalog items assigned to categories

**Rationale**: Even if API calls succeed, empty catalog means empty product grids. The Square Dashboard must have items created and assigned to categories for data to flow.

## 4. Existing Infrastructure Sufficiency

**Decision**: Existing `lib/square/catalog.ts` functions are correctly implemented — no code changes needed

**Rationale**: The cursor pagination, subcategory annotation, price normalization, and error handling were all built and tested in the subcategory-filtering feature. The bug is in the data/environment layer, not the code layer.
