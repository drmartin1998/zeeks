# Data Model: SDK-Only Product Fetching

**Feature**: 007-sdk-product-fetching
**Date**: 2026-08-01

## Entities

### 1. CatalogCategory (Square Raw)

Represents a Square catalog category object as received from the SDK.

| Field | Type | Source | Validation |
|-------|------|--------|------------|
| `id` | `string` | SDK | Non-empty |
| `type` | `"CATEGORY"` literal | SDK | Must be `"CATEGORY"` |
| `categoryData.name` | `string` | SDK | Non-empty |
| `categoryData.parentCategoryId` | `string \| undefined` | SDK | Optional; presence indicates subcategory |
| `categoryData.isTopLevel` | `boolean \| undefined` | SDK | Optional Square flag |

### 2. CatalogItem (Square Raw)

Represents a Square catalog item object as received from the SDK.

| Field | Type | Source | Validation |
|-------|------|--------|------------|
| `id` | `string` | SDK | Non-empty |
| `type` | `"ITEM"` literal | SDK | Must be `"ITEM"` |
| `itemData.name` | `string` | SDK | Non-empty, defaults to `"Untitled"` |
| `itemData.description` | `string \| undefined` | SDK | Optional plaintext |
| `itemData.categories` | `{ id: string }[]` | SDK | Array of category references |
| `itemData.variations[0].itemVariationData.priceMoney.amount` | `bigint \| undefined` | SDK | Amount in smallest currency unit (cents) |
| `itemData.variations[0].itemVariationData.priceMoney.currency` | `string \| undefined` | SDK | ISO 4217 currency code |
| `itemData.imageIds` | `string[] \| undefined` | SDK | References to Square image objects |

### 3. Product (Application-Level)

The transformed, Zod-validated product shape used by components.

| Field | Type | Derived From | Notes |
|-------|------|-------------|-------|
| `id` | `string` | `CatalogItem.id` | Square catalog item ID |
| `title` | `string` | `itemData.name` | Display name |
| `description` | `string \| undefined` | `itemData.description` | Plaintext description |
| `category` | `string` | Resolved category name | Parent category display name |
| `categorySlug` | `string` | Slugified category name | URL-friendly identifier |
| `subCategory` | `string \| undefined` | Resolved subcategory name | Only if item belongs to a subcategory |
| `subCategorySlug` | `string \| undefined` | Slugified subcategory name | URL-friendly identifier |
| `price` | `number` | `amount / 100` | Price in dollars (e.g., 39.99) |
| `currency` | `string` | `currency` from priceMoney | ISO 4217 (e.g., "USD") |
| `imageUrl` | `string \| undefined` | Resolved from imageIds | First image URL if available |
| `gradient` | `string` | Default gradient | CSS Tailwind gradient class |

### 4. ProductSearchResult

Paginated search response returned by the products/search Route Handler.

| Field | Type | Description |
|-------|------|-------------|
| `products` | `Product[]` | Array of matched products |
| `cursor` | `string \| undefined` | Pagination cursor for next page |
| `totalCount` | `number \| undefined` | Approximate total (if provided by Square) |

### 5. NavCategory (Application-Level)

Navigation category used by the NavBar component. Already defined in `lib/square/types.ts`.

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Display label |
| `href` | `string` | Navigation target URL |
| `highlight` | `boolean \| undefined` | Visual emphasis (e.g., "Sale") |

## State Transitions

### Product Data Fetching

```
[Server Component mounts]
       │
       ▼
  fetch("/api/catalog/products?slug=miniatures")
       │
       ├── Success ──▶ Validate with Zod ──▶ Return Product[]
       │
       ├── 404 (no category) ──▶ notFound()
       │
       ├── Transient Error ──▶ Retry (up to 3x with backoff)
       │       │
       │       ├── Success ──▶ Validate with Zod ──▶ Return Product[]
       │       └── Exhausted ──▶ Return error state
       │
       └── Non-transient Error ──▶ Return error state (no fallback data)
```

### Error State Display

```
[Fetch returns error]
       │
       ▼
  Server Component renders ErrorBanner
       │
       ▼
  User sees: "Products temporarily unavailable"
              [Retry button]
```

## Relationships

```
Square Catalog Category (1) ──has many──▶ Square Catalog Category (subcategories)
Square Catalog Category (1) ──has many──▶ Square Catalog Item (products)
Square Catalog Item    (1) ──has one───▶ Money (price)
Square Catalog Item    (1) ──has many───▶ Item Variation
Square Catalog Item    (1) ──has many───▶ Image (via imageIds)
```

## Validation Rules

All Zod schemas defined in `lib/square/types.ts`:

- **CategoryIdSchema**: `z.string().min(1)`
- **CategoryNameSchema**: `z.string().min(1)`
- **PriceSchema**: `z.number().min(0)` (free items allowed)
- **ProductSchema**: All fields with appropriate constraints
- **SearchParamsSchema**: `z.object({ slug: z.string().min(1), cursor: z.string().optional() })`
- **ErrorResponseSchema**: `z.object({ error: z.string() })`
