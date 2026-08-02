# Data Model: Allowlisted Category Filtering

**Date**: 2026-08-01

## Overview

This feature introduces no new entities or data structures. It adds a filter to the existing `SquareCatalogCategory` data flow that restricts which top-level categories reach consumers.

## Existing Entities (Unchanged)

### SquareCatalogCategory

Source: Square Catalog API → `lib/square/types.ts`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Square category ID (used for allowlist matching) |
| `type` | `"CATEGORY"` | Literal type discriminator |
| `categoryData.name` | `string` | Display name |
| `categoryData.parentCategory.id` | `string \| undefined` | Parent category ID (undefined/null/empty = top-level) |
| `categoryData.isTopLevel` | `boolean \| undefined` | Square's explicit top-level flag |

### NavCategory

Source: Derived from `SquareCatalogCategory` via `mapSquareCategoryToNavCategory()`

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Category display name |
| `href` | `string` | URL path (e.g., `/categories/miniatures`) |
| `highlight` | `boolean \| undefined` | Whether to highlight (e.g., Sale link) |

## New Constant

### ALLOWED_CATEGORY_IDS

Location: `lib/square/catalog.ts`

```typescript
const ALLOWED_CATEGORY_IDS = [
  "ZCZJWQX6WREDLATZFW3U7OCJ",  // Miniatures
  "62G7JSXJDS4U574NW4XS4WKV",  // Hobby Supplies
];
```

## Data Flow

```text
Square Catalog API
    │
    ▼
catalogApi.search({ objectTypes: ["CATEGORY"] })
    │
    ▼
fetchAllCategories()
    │
    ├── Filter: type === "CATEGORY" && categoryData (existing)
    │
    ├── Filter: isTopLevelCategory() === true  ← NEW: ALLOWED_CATEGORY_IDS check
    │       only allowlisted IDs pass
    │
    ▼
SquareCatalogCategory[] (allowlisted only)
    │
    ├──► getSquareCategories()       → nav bar, category pages
    ├──► getSquareCategoryBySlug()   → single category lookup
    ├──► getSquareProductsByCategorySlug() → product listing (via parent ID)
    └──► GET /api/catalog/categories → API response
```

## Validation Rules

- A category MUST have an `id` that matches one of the `ALLOWED_CATEGORY_IDS` to be returned as a top-level category.
- Subcategories (categories with `parentCategory.id`) are NOT filtered by the allowlist — they pass through and are handled by `isTopLevelCategory()` at each consumer.
- If no allowlisted categories exist in the Square response, an empty array is returned (no error).
