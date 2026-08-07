# Data Model: Search Typeahead

**Feature**: 031-search-typeahead
**Date**: 2026-08-07

## Entities

### 1. Suggestion (Application-Level, Client)

A single product suggestion rendered as a row in the typeahead dropdown. It is a client-facing view of a catalog product.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `slug` | `string` | Derived: `slugify(title)` | URL-safe product slug for the detail-page link |
| `title` | `string` | `itemData.name` | Product display name (the suggestion label) |
| `price` | `number` | First variation price / 100 | Price in dollars |
| `image` | `string \| undefined` | Resolved image URL | Optional product image for the row |
| `category` | `string` | "Search Results" or category | Category label for the row |
| `catalogObjectId` | `string \| undefined` | `CatalogObject.id` | Square catalog item ID (React key) |

### 2. SearchResponse (API, Typeahead)

The response from the search Route Handler for a typeahead query.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `products` | `Suggestion[]` | `catalogApi.searchItems` + transform | Up to 5 matching products |
| `totalCount` | `number` | Length of full match set | Total matches for the query (shown as "(N results)") |
| `cursor` | `string \| undefined` | Search cursor | Pagination cursor (not needed for typeahead) |

### 3. Query

The current text in the search input; drives which suggestions are fetched. A whitespace-only query produces no request (FR-011).

### 4. TypeaheadState (UI, Derived)

The client-side state of the typeahead dropdown.

| State | Description |
|-------|-------------|
| `idle` | Input not focused / empty; no dropdown |
| `loading` | Query entered; request in flight (loading indicator) |
| `results` | Suggestions available; dropdown shows the results panel |
| `empty` | Query yielded no matches; dropdown shows the empty-state panel |
| `closed` | Dropdown dismissed (Escape, outside click, clear) |

## Relationships

- **Query** 1—N **Suggestion**: one query produces zero or more product suggestions.
- **Suggestion** 1—1 **Product**: each suggestion maps to a catalog product; selecting it navigates to `/products/<slug>`.
- **Query** → **Search Response**: the debounced fetch returns a `SearchResponse` for the current query.

## Validation Rules

- A whitespace-only query MUST NOT trigger a request (FR-011).
- The dropdown MUST show at most 5 suggestions (clarification Q2).
- The results count MUST equal the total matching products, which may exceed the 5 displayed (FR-003).
- Selecting a suggestion MUST navigate to that product's detail page (FR-002).
- The "View all results" action MUST navigate to `/search?q=<query>` (FR-004).

## State Transitions

- **Input focused + query empty** → idle (no dropdown).
- **User types a non-whitespace query** → debounce timer starts; after the pause (≤300ms) a request fires → loading.
- **Request resolves with matches** → results state; dropdown shows header ("PRODUCTS (N results)"), up to 5 rows, and the "View all" footer.
- **Request resolves with zero matches** → empty state; dropdown shows the "No products found" panel.
- **User selects a suggestion** → navigate to `/products/<slug>`; dropdown closes.
- **User selects "View all results"** → navigate to `/search?q=<query>`; dropdown closes.
- **User presses Escape / clicks outside / uses the clear control** → closed; input empties on clear (FR-005, FR-009).
- **Keyboard navigation** → ArrowUp/Down moves the highlighted row; Enter selects (FR-010).