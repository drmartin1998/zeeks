# Research: Search Typeahead

**Feature**: 031-search-typeahead
**Date**: 2026-08-07

## 1. Suggestion Data Source — Debounced Server-Side Fetch

**Decision**: Fetch suggestions from the catalog on each pause in typing via the existing `/api/catalog/products/search?q=` Route Handler, debounced (SC-001: within 300ms of the shopper pausing).

**Rationale**: Clarification Q1 chose server-side search so suggestions reflect fresh catalog data. The project already has a search Route Handler (`app/api/catalog/products/search/route.ts`) that calls `catalogApi.searchItems` with a `textFilter` and returns `{ products, cursor }`. Reusing it avoids a new data path and keeps Square credentials server-side (Constitution II).

**Implementation**:
- The typeahead client component maintains the input value and a debounced effect (e.g., ~250ms via `setTimeout`/`clearTimeout`) that fires `fetch("/api/catalog/products/search?q=<query>")` once the query is non-whitespace.
- The route already limits results to 100; for the typeahead, add an optional `limit` query param (capped at 5 for the dropdown) so only the needed suggestions are returned. The full search page keeps its default limit.
- Show a lightweight loading indicator while awaiting results; on failure, fall back to the standard submit flow without breaking the page (edge case).

**Alternatives considered**:
- **Client-side filtering of a preloaded catalog**: Rejected — clarification Q1 chose server-side.
- **New dedicated typeahead endpoint**: Rejected — the existing search route already returns the needed data; only a `limit` param is needed.

## 2. Suggestion Cap and "View All"

**Decision**: The dropdown shows up to 5 suggestions (clarification Q2, matching the Figma product-row layout). A results header shows "PRODUCTS (N results)" where N is the total match count, and a footer shows "View all N results for 'query' →" linking to `/search?q=<query>` (FR-003, FR-004).

**Rationale**: The Figma component set's `State=Results` variant renders 5 product rows, a results-count header, and a view-all footer. The "View all" preserves access to the full results experience.

**Implementation**:
- The search route returns the total count (the length of the full `products` array when not capped, or the search cursor/result metadata). For the typeahead, return the total count alongside the capped suggestion list.
- Selecting a suggestion navigates to `/products/<slug>` (FR-002); "View all" navigates to `/search?q=<query>` (FR-004).

## 3. Empty State

**Decision**: When a query returns zero matches, the dropdown shows the `State=Empty` design: a ghost icon, "No products found for 'query'" (bold), and "Try searching for 'miniatures', 'board games', or 'paint'" (with the example terms emphasized) (FR-006).

**Rationale**: Matches the Figma `State=Empty` variant exactly.

**Implementation**:
- When the search route returns an empty `products` array and the query is non-empty, render the empty-state panel.
- The example search terms are static copy (application copy, not catalog data — allowed per the no-mock-data rule).

## 4. Progressive Enhancement

**Decision**: The typeahead is a client-side enhancement layered on the existing search bar form, which continues to submit to `/search?q=` on Enter (FR-008).

**Rationale**: Constitution V (Progressive Enhancement) — the baseline search form must work without JavaScript; the typeahead dropdown layers on top.

**Implementation**:
- The nav-bar's `<form>` is retained; the input is enhanced by the typeahead component which adds the debounced fetch + dropdown.
- Submitting (Enter or the search button) still navigates to `/search?q=<query>`.

## 5. Accessibility

**Decision**: The suggestion list is navigable by keyboard (arrow up/down to move, Enter to select) and accessible to screen readers (FR-010).

**Rationale**: Constitution/testing rules prioritize accessible queries and keyboard support.

**Implementation**:
- Use a `combobox`-style ARIA pattern: `role="combobox"` on the input, `role="listbox"`/`role="option"` on the suggestion list, `aria-expanded`, and `aria-controls` linking input to list.
- Track the active (highlighted) suggestion index; ArrowUp/Down change it, Enter selects, Escape closes (FR-009).
- Each suggestion row has a visible label (product name) and is keyboard-focusable/selectable.

## Assumptions

- The search route's `Product` shape is sufficient for suggestions (title, price, slug, image). If suggestion rows need an image, the route already returns product data; the typeahead can render a placeholder gradient until a real image is available.
- The existing search route returns products ordered by Square's relevance; the top 5 are shown as-is.