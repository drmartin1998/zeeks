# Contracts: Faceted Product Listing Filters

**Feature**: 030-product-faceted-filters
**Date**: 2026-08-06

## Contract 1: Category Product Listing — `GET /api/catalog/products?slug={categorySlug}`

This endpoint supplies the category's products. The response is extended to include `brand` and `availability` so the client can build the facet groups. Filtering itself is client-side, so no filter query parameters are required on this endpoint; the server returns the full category product set.

### Request

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | `string` (query) | Yes | Top-level category slug (e.g., `miniatures`) |

### Response: 200 OK

```json
{
  "products": [
    {
      "slug": "warhammer-40k-paint-set",
      "title": "Warhammer 40K Paint Set",
      "category": "Miniatures",
      "categorySlug": "miniatures",
      "subCategory": "Paints",
      "subCategorySlug": "paints",
      "price": 49.99,
      "minPrice": 49.99,
      "maxPrice": 49.99,
      "image": "https://square-image.url/1",
      "gradient": "from-zeeks-purple to-zeeks-purple-dark",
      "catalogObjectId": "ITEM_ID",
      "variationId": "VAR_ID",
      "hasVariations": false,
      "brand": "Games Workshop",
      "availability": "IN_STOCK"
    }
  ],
  "cursor": null
}
```

### Response: 404 Not Found

Returned when the category slug does not resolve to a known top-level category.

### Contract Notes

- `brand` is `string | null` — derived from the item's brand custom attribute value; `null` when a product carries no brand.
- `availability` is `"IN_STOCK" | "OUT_OF_STOCK"` — `"IN_STOCK"` when any variation is available at the configured location.
- The page component (`app/shop/[category]/page.tsx`) currently calls the `lib/square/catalog.ts` functions directly rather than this route (consistent with the existing `getSquareProductsByCategorySlug` deprecation note). Both paths MUST surface `brand` and `availability` identically.

## Contract 2: Product Listing Page Facet State (UI Contract)

The `ProductListingPage` client component accepts products plus the facet groups and manages filter state. The URL query params are the shared contract for filter state (FR-009, edge case).

| Query Param | Type | Description | Example |
|-------------|------|-------------|---------|
| `sub` | `string` | Subcategory slug (single-select) | `?sub=paints` |
| `brand` | `string` (repeatable) | Brand value (multi-select) | `?brand=Games%20Workshop&brand=Citadel` |
| `availability` | `string` (repeatable) | Availability state | `?availability=IN_STOCK` |

### Contract Notes

- `sub` is single-select (matches existing behavior); `brand` and `availability` are multi-select.
- The active-filter count (FR-007) equals the number of selected options across all three facets.
- Facet options dynamically narrow (FR-003, FR-006) to values present among the currently filtered product set.