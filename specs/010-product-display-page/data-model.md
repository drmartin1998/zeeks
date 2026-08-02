# Data Model: Product Display Page

**Feature**: 010-product-display-page
**Date**: 2026-08-02

## Entities

### 1. ProductDetail (Application-Level)

Enriched product data for the detail page. Extends the existing `Product` type with images, variations, category hierarchy, and inventory.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `id` | `string` | `CatalogObject.id` | Square catalog item ID |
| `title` | `string` | `itemData.name` | Product display name |
| `slug` | `string` | Derived: `slugify(title)` | URL-safe identifier |
| `description` | `string \| undefined` | `itemData.description` | Full product description (may contain plain text or HTML) |
| `price` | `number` | `variations[0].itemVariationData.priceMoney.amount / 100` | Price in dollars |
| `currency` | `string` | `priceMoney.currency` | ISO 4217 currency code, defaults to "USD" |
| `images` | `string[]` | Resolved from `itemData.imageIds[]` via related objects | Array of image URLs; first is primary |
| `variations` | `ProductVariation[]` | `itemData.variations[]` | Available product variations |
| `category` | `{ name: string, slug: string }` | Resolved via `categoryId` → category lookup | Parent category for breadcrumbs |
| `subCategory` | `{ name: string, slug: string } \| undefined` | Resolved if `parentCategory.id` exists | Subcategory for breadcrumbs |
| `inventoryStatus` | `"IN_STOCK" \| "OUT_OF_STOCK" \| "UNKNOWN"` | Derived from variation inventory | Availability indicator |
| `gradient` | `string` | Default gradient | CSS Tailwind gradient class for placeholder |
| `relatedProducts` | `Product[]` | From same category, excluding self | Up to 4 related products |

### 2. ProductVariation

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `id` | `string` | `CatalogObject.id` | Variation object ID |
| `name` | `string` | `itemVariationData.name` | Variation display name (e.g., "Large", "Red") |
| `sku` | `string \| undefined` | `itemVariationData.sku` | Stock keeping unit |
| `price` | `number` | `itemVariationData.priceMoney.amount / 100` | Variation-specific price (overrides item price) |
| `imageUrl` | `string \| undefined` | Resolved from `itemVariationData.imageIds[0]` | Variation-specific image |
| `inventoryCount` | `number \| undefined` | Inventory API or variation data | Available quantity |

### 3. Route Handler Request/Response

**Request**: `GET /api/catalog/products/slug/[slug]`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | `string` (path param) | Yes | URL-safe product identifier |

**Response: 200 OK**
```json
{
  "id": "CATALOG_ITEM_ID",
  "title": "Space Marines",
  "slug": "space-marines",
  "description": "A set of 10 Space Marine miniatures...",
  "price": 49.99,
  "currency": "USD",
  "images": ["https://square-image.url/1", "https://square-image.url/2"],
  "variations": [
    {
      "id": "VAR_ID",
      "name": "Standard",
      "sku": "SM-001",
      "price": 49.99,
      "imageUrl": null,
      "inventoryCount": 15
    }
  ],
  "category": { "name": "Miniatures", "slug": "miniatures" },
  "subCategory": { "name": "Warhammer 40K", "slug": "warhammer-40k" },
  "inventoryStatus": "IN_STOCK",
  "gradient": "from-zeeks-purple to-zeeks-purple-dark",
  "relatedProducts": [ /* up to 4 Product objects */ ]
}
```

**Response: 404**
```json
{ "error": "Product not found" }
```

## Data Flow

```
Square API
  │
  ├── catalogApi.search({ objectTypes: ["ITEM"] })
  │     → All catalog items (IDs + names) — same method as fetchAllCategories()
  │
  ├── Match by slugify(name) === targetSlug
  │     → Found item ID
  │
  ├── batchGet(objectIds: [itemId], includeRelatedObjects: true)
  │     → Full item data + images + variations
  │
  ├── fetchAllCategories()
  │     → Category breadcrumb resolution
  │
  └── searchItems(categoryIds: [parentCategoryId], limit: 5)
        → Related products (exclude current)

getProductDetailBySlug() → ProductDetail (called directly from page)
  │
  ▼
app/products/[slug]/page.tsx (Server Component — NO self-fetching)
  │
  ├── ProductImageGallery (client: image switching)
  ├── ProductInfo (server: title, price, description)
  ├── ProductVariations (client: variation selection)
  └── RelatedProducts (server: product cards grid)
```

> **Architecture note**: The page component calls `getProductDetailBySlug()` directly rather than `fetch()`-ing the Route Handler. Next.js blocks self-referencing `fetch()` calls during Server Component rendering. The separate Route Handler at `/api/catalog/products/slug/[slug]` remains available for external API consumers and E2E tests.

## State Transitions

**Product Page**: Loaded → (user selects variation) → Updated price/image → (user changes quantity) → Updated quantity → (user clicks add-to-cart) → [future: cart integration]

**Image Gallery**: Default image → (user clicks thumbnail) → Selected image displayed in main viewport

**Inventory Status**:
- `IN_STOCK` → add-to-cart button enabled
- `OUT_OF_STOCK` → add-to-cart button disabled, "Out of Stock" badge shown
- `UNKNOWN` → add-to-cart button enabled with warning (inventory tracking may be disabled)
