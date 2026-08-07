# Contracts: Search Typeahead

**Feature**: 031-search-typeahead
**Date**: 2026-08-07

## Contract 1: Search Suggestions — `GET /api/catalog/products/search?q={query}`

The typeahead reuses the existing search Route Handler, extended with an optional `limit` param to cap suggestions. The response includes the suggestion list and a total count.

### Request

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | `string` (query) | Yes | The search query text (must be non-whitespace) |
| `limit` | `number` (query) | No | Cap on the number of suggestions returned (typeahead passes `5`); defaults to 100 |
| `cursor` | `string` (query) | No | Pagination cursor (not used by the typeahead) |

### Response: 200 OK

```json
{
  "products": [
    {
      "id": "ITEM_ID",
      "title": "Warhammer 40K Paint Set",
      "slug": "warhammer-40k-paint-set",
      "price": 49.99,
      "image": "https://square-image.url/1",
      "category": "Search Results",
      "catalogObjectId": "ITEM_ID",
      "gradient": "from-zeeks-purple to-zeeks-purple-dark"
    }
  ],
  "totalCount": 8,
  "cursor": null
}
```

### Response: 400 Bad Request

Returned when `q` is missing or invalid (validated by `ProductSearchParamsSchema`).

### Contract Notes

- `products` is the capped suggestion list (≤5 for the typeahead via `limit`).
- `totalCount` is the total number of catalog matches for the query (used for the "PRODUCTS (N results)" header and the "View all N results" footer). It may exceed `products.length` when `limit` is applied.
- The typeahead navigates to `/products/{slug}` when a suggestion is selected and to `/search?q={query}` for "View all results".

## Contract 2: Typeahead UI Contract

The `SearchTypeahead` client component replaces the nav-bar search input. It exposes the debounced fetch and the two dropdown states.

### Behavior Contract

| Interaction | Result |
|-------------|--------|
| Type a non-whitespace query | Debounced (≤300ms) request to the search route; dropdown shows results or empty state |
| Select a suggestion | Navigate to `/products/{slug}`; dropdown closes |
| Select "View all results" | Navigate to `/search?q={query}`; dropdown closes |
| Clear control / Escape / outside click | Dropdown closes; clear empties the input |
| ArrowUp/ArrowDown + Enter | Keyboard navigation over suggestions |
| Submit (Enter or search button) | Navigate to `/search?q={query}` (existing form behavior preserved) |

### Accessibility Contract

- Input: `role="combobox"`, `aria-expanded`, `aria-controls` linking to the list.
- List: `role="listbox"`; rows: `role="option"` with `aria-selected`.
- All interactions reachable by keyboard and announced to screen readers.