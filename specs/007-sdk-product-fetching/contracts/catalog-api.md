# Catalog API Contracts

**Feature**: 007-sdk-product-fetching
**Date**: 2026-08-01

These are the HTTP API contracts exposed by the catalog Route Handlers. Server Components consume these via `fetch()`.

---

## GET /api/catalog/categories

**Status**: Already exists — verified compliant. No changes needed for this feature.

### Response 200

```json
[
  { "label": "Miniatures", "href": "/categories/miniatures" },
  { "label": "Hobby Supplies", "href": "/categories/hobby-supplies" },
  { "label": "About Us", "href": "/about" },
  { "label": "Locations", "href": "/locations" },
  { "label": "Sale", "href": "/categories/sale", "highlight": true }
]
```

### Response 502 (Square API Error)

```json
{ "error": "Failed to fetch categories" }
```

### Headers

```
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
Content-Type: application/json
```

---

## GET /api/catalog/products?slug={slug}

**Status**: NEW — to be created.

Fetch all products in a category (including subcategories) by category slug.

### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | `string` | Yes | URL slug of the category (e.g., "miniatures") |
| `cursor` | `string` | No | Pagination cursor from previous response |

### Response 200

```json
{
  "products": [
    {
      "id": "ITEM_ID_123",
      "title": "Leviathan Starter Set",
      "description": "The ultimate Warhammer 40,000 starter set",
      "category": "Miniatures",
      "categorySlug": "miniatures",
      "subCategory": "Warhammer 40K",
      "subCategorySlug": "warhammer-40k",
      "price": 210.00,
      "currency": "USD",
      "imageUrl": "https://square-images.example.com/abc123",
      "gradient": "from-slate-700 to-slate-900"
    }
  ],
  "cursor": "NEXT_PAGE_CURSOR",
  "totalCount": 42
}
```

### Response 404

```json
{ "error": "Category not found" }
```

### Response 502

```json
{ "error": "Products temporarily unavailable. Please try again." }
```

### Headers

```
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
Content-Type: application/json
```

---

## GET /api/catalog/products/search?q={query}

**Status**: NEW — to be created.

Search products by text query using Square's catalog search.

### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | `string` | Yes | Search query (min 1 character) |
| `cursor` | `string` | No | Pagination cursor |

### Response 200

Same shape as `/api/catalog/products` response.

### Response 400

```json
{ "error": "Search query is required" }
```

### Response 502

```json
{ "error": "Search temporarily unavailable. Please try again." }
```

---

## GET /api/catalog/products/{id}

**Status**: NEW — to be created.

Fetch a single product by its Square catalog item ID.

### Path Parameters

| Param | Type | Description |
|-------|------|-------------|
| `id` | `string` | Square catalog item ID |

### Response 200

Single `Product` object (same shape as items in the products array).

### Response 404

```json
{ "error": "Product not found" }
```

### Response 502

```json
{ "error": "Product details temporarily unavailable." }
```

### Headers

```
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
```

---

## Shared Error Response Format

All error responses follow this contract:

```typescript
interface ApiErrorResponse {
  error: string;        // Human-readable error message
}
```

HTTP status codes:
- `400` — Invalid request (bad query params)
- `404` — Resource not found
- `502` — Square API unavailable (after retries exhausted)
- `504` — Square API timeout

## Shared Headers

All catalog endpoints return:

```
Content-Type: application/json
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
```

## Retry Behavior (Internal)

All endpoints implement exponential backoff retry:
- Max retries: 3
- Base delay: 500ms
- Multiplier: 2x (500ms → 1s → 2s)
- Jitter: ±100ms random
- Retryable: network errors, 429, 5xx
- Non-retryable: 400, 401, 403, 404
