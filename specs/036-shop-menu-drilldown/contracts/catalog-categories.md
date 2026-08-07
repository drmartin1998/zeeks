# Contract: GET /api/catalog/categories (extended for Shop menu)

**Feature**: 036-shop-menu-drilldown | **Date**: 2026-08-07

The existing `/api/catalog/categories` route is extended to return a nested category tree. The response shape changes from a flat `NavCategory[]` to a tree of `NavCategoryNode[]`.

## Request

```
GET /api/catalog/categories?nested=true
```

- `nested=true` (optional): when present, returns the hierarchical tree. When absent, the route returns the existing flat top-level list (backward compatible for other consumers).

## Response (200 OK)

```json
{
  "tree": [
    {
      "label": "Miniatures",
      "href": "/categories/miniatures",
      "children": [
        {
          "label": "Games Workshop",
          "href": "/categories/miniatures?sub=games-workshop",
          "children": [
            {
              "label": "Warhammer 40K",
              "href": "/categories/miniatures?sub=warhammer-40k",
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

- `tree`: array of top-level `NavCategoryNode`s. Each node has `label`, `href`, and `children` (recursive, up to two nesting levels below top-level).
- A leaf node has `children: []`.
- `Nested=true` is optional; omit it to preserve the legacy flat response.

## Response (error)

```json
{ "error": "Failed to fetch categories" }
```

- Status `502` when Square is unreachable or data cannot be loaded.

## Headers

- `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` (unchanged).

## Validation (Zod)

The response body is validated with a Zod schema (Constitution III). The tree is normalized to a `NavCategoryNode[]` where `children` is always an array.

## Consumers

- `NavBarServer` / `getNavCategoryTree()` (server data layer) — fetches with `nested=true`, shapes into `CategoryTree`.
- Existing consumers of the flat response remain unaffected when `nested=true` is omitted.