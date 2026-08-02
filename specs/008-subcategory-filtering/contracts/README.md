# API Contracts: Subcategory Filtering

**Feature**: 008-subcategory-filtering

This feature relies on existing Route Handlers. No new API endpoints are introduced.

## Existing Endpoints Used

### GET /api/catalog/products

Returns products for a given category slug, including products from subcategories.

**Query Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | `string` | Yes | Category slug (e.g., `miniatures`) |

**Response (200)**:
```json
{
  "products": [
    {
      "id": "string",
      "title": "string",
      "slug": "string",
      "category": "string",
      "categorySlug": "string",
      "subCategory": "string | undefined",
      "subCategorySlug": "string | undefined",
      "price": "number",
      "image": "string"
    }
  ],
  "subCategories": [
    {
      "id": "string",
      "name": "string",
      "slug": "string"
    }
  ]
}
```

**Response (404)**: Category not found — returns 404.

### GET /api/catalog/categories

Returns all allowed top-level categories for navigation.

**Response (200)**:
```json
{
  "categories": [
    {
      "label": "string",
      "href": "string",
      "highlight": "boolean | undefined"
    }
  ]
}
```

## Internal Data Contracts (lib/square/catalog.ts)

These pure functions are exported for use by Route Handlers and components:

### `getSquareSubcategories(parentSlug: string): Promise<SquareSubCategory[]>`

Resolves all child subcategories for a given parent category slug.

### `slugify(name: string): string`

Converts a category name to a URL-safe slug. Used consistently across the application.
