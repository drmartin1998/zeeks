# Research: Channel-Based Category Filtering

## 1. Square API Channel Filter Support

**Decision**: Apply channel filter **client-side** after fetching all categories.

**Rationale**: Square's `searchObjects` API provides `CatalogQuery` types that support filtering by exact match, set, prefix, range, text, tax, modifier list, and item options. None of these query types target the `channels` array on category objects. The `channels` field is returned in the response data but is not a queryable filter at the Square API level.

**Alternatives considered**:
- Server-side filter at API level: Not supported by Square
- Individual category lookup with channel check: Too many API calls
- Webhook-based sync: Over-engineered for static channel filtering

## 2. Channels Field in Square Response

**Decision**: Categories already include a `channels` array in the API response.

**Evidence**: Square API response for category "Games Workshop":
```json
{
  "category_data": {
    "name": "Games Workshop",
    "channels": ["CH_OrhX79MIOum3uOhr8KnBzquFGS49n9UPgaY0hRlQuYC", "CH_zNTh1RdktHh0AQ362Egjt0mUUB5xvj7bpZHdkc049945o"]
  }
}
```

**Rationale**: The `channels` field is already present on every category object. No additional API calls or schema changes needed beyond adding the field to the TypeScript type definition.

## 3. Environment Variable Configuration

**Decision**: Store channel ID in `SQUARE_CHANNEL_ID` environment variable.

**Rationale**: 
- Already part of the Vercel environment variable system
- Server-only (never exposed to browser per Constitution II)
- Easy to change without code deployment
- Consistent with existing `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID` naming

**Alternatives considered**:
- Hardcoded constant: Not flexible; requires code change to update
- Config file: Adds dependency; env vars are standard for Next.js/Vercel

## 4. Filter Order: Channel vs Allowlist

**Decision**: Channel filter BEFORE allowlist filter.

**Rationale**: The channel filter is broader (excludes all non-channel categories). The allowlist filter is narrower (selects specific top-level categories within the channel). Applying channel first reduces the set that the allowlist operates on, making the logic clearer and more efficient.

**Filter pipeline**:
```
All Square categories
  → channel filter (includes only SQUARE_CHANNEL_ID)
  → allowlist filter (allows subcategories + specific top-level IDs)
  → isTopLevelCategory filter (at consumer level)
  → map to display types
```

## 5. Subcategory Handling

**Decision**: Subcategories inherit channel eligibility from their parent.

**Rationale**: In `fetchAllCategories()`, subcategories pass through when `parentCategory.id` exists. The channel filter is applied to ALL categories before the allowlist, so:
- If parent is NOT in channel → parent is filtered out → subcategory's `parentCategory.id` never matches any returned parent → subcategory effectively excluded
- If parent IS in channel → parent passes → subcategory passes (has `parentCategory.id`) → appears in results

This means FR-005 is satisfied automatically with no special subcategory channel logic: filtering the parent by channel implicitly filters its children.

**Caveat**: A subcategory directly added to the target channel but whose parent is not in the channel would not pass through (blocked by the parent filter in allowlist). This is correct behavior — a subcategory shouldn't appear without its parent.

## 6. Missing Environment Variable Handling

**Decision**: Log warning, return empty array.

**Rationale**: If `SQUARE_CHANNEL_ID` is missing, the system cannot determine which channel to filter by. Returning all categories would violate the spec (SC-001, SC-003). Returning an empty array is safe and makes the problem immediately visible (empty navigation = obvious). A console warning helps developers debug.

**Implementation**: `console.warn("SQUARE_CHANNEL_ID not configured; no categories will be returned")`

## 7. Impact on Route Handlers

**Decision**: Route handlers inherit channel filtering automatically — no changes needed.

**Rationale**: Both `GET /api/catalog/categories` and `GET /api/catalog/products` already call `fetchAllCategories()` internally. Since the channel filter is added to `fetchAllCategories()`, these route handlers automatically receive channel-filtered data. The route handler for products also benefits because `getSquareProductsByCategorySlug()` calls `fetchAllCategories()` to resolve the parent category — if the parent is excluded by channel, it returns null → the route returns 404.
