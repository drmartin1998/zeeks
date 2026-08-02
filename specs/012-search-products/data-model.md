# Data Model: Product Search

**Feature**: 012-search-products
**Date**: 2026-08-02

## Function: searchProductsByQuery

```
searchProductsByQuery(q: string) → DisplayProduct[]
```

| Step | API Call | Purpose |
|------|----------|---------|
| 1 | `catalogApi.searchItems({ textFilter: q, enabledLocationIds: [locationId], limit: 100 })` | Find matching items |
| 2 | Map items → DisplayProduct | Transform to display format with slug, title, price |

## Page: /search

Server Component. Reads `?q=` from searchParams. Calls `searchProductsByQuery()`. Renders:
- Heading: "Search results for 'keyword'" with result count
- ProductGrid (existing component)
- Empty state: "No products found for 'keyword'"

## Nav Bar Search

Client-side form with `useState` for input value and `useRouter` for navigation. On submit, navigates to `/search?q=keyword`.
