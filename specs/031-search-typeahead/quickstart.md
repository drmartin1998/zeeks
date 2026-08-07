# Quickstart: Search Typeahead

**Feature**: 031-search-typeahead
**Date**: 2026-08-07

## Prerequisites

- [ ] Dev server running (`vercel dev` on port 3000; check `lsof -ti:3000` first, reuse if already running)
- [ ] `.env.local` configured with `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_CHANNEL_ID`
- [ ] Square catalog has products (e.g., "Warhammer", "paint", "miniatures")
- [ ] TypeScript compiles cleanly: `tsc --noEmit`
- [ ] Lint passes: `npm run lint`

## Validation Scenarios

### VS-1: Search suggestions endpoint returns capped results

```bash
# Fetch suggestions for a query (limit 5)
curl -s "http://localhost:3000/api/catalog/products/search?q=warhammer&limit=5" | jq '{totalCount, shown: (.products | length)}'
```

**Expected**: `shown` is ≤ 5, and `totalCount` is the full match count. Each product has `title`, `price`, `slug`. See [contracts/api.md](./contracts/api.md).

### VS-2: Typeahead shows suggestions while typing

1. Navigate to any page (`http://localhost:3000/`).
2. Focus the navigation search bar and type a partial keyword (e.g., "war").
3. **Expected**: A dropdown appears with up to 5 matching product suggestions, a "PRODUCTS (N results)" header, and a "View all N results for 'war' →" footer.

### VS-3: Suggestions update with continued typing

1. Type "war" → note the suggestions.
2. Continue typing "warhammer".
3. **Expected**: The suggestions update to reflect the full query.

### VS-4: Select a suggestion opens the product

1. With suggestions showing, click a suggested product.
2. **Expected**: You navigate to that product's detail page (`/products/<slug>`).

### VS-5: View all results opens the search page

1. With suggestions showing, click "View all results".
2. **Expected**: You navigate to `/search?q=<query>` showing the full results.

### VS-6: Clear control and empty state

1. Type a query → a clear "x" control appears in the input.
2. Click the clear control.
3. **Expected**: The input empties and the dropdown closes.
4. Type a nonsense query (e.g., "zzzqqq").
5. **Expected**: The dropdown shows "No products found for 'zzzqqq'" with alternative search suggestions.

### VS-7: Keyboard navigation and dismissal

1. Type a query to show suggestions.
2. Press ArrowDown/ArrowUp to move through suggestions; press Enter to select.
3. Press Escape (or click outside the dropdown).
4. **Expected**: The dropdown closes; Escape dismisses without clearing.

See [data-model.md](./data-model.md) for the state model and [contracts/api.md](./contracts/api.md) for the API contract.

## Automated Tests

- **Unit/Integration**: `npm test` — typeahead component tests (debounce, suggestions render, empty state, keyboard nav, clear/close) using RTL + MSW to mock the search route.
- **E2E**: `npm run test:e2e` — the navigation search journey: type a query, see suggestions, select one, land on the product page.

## Definition of Done

- `tsc --noEmit` passes; `npm run lint` passes with zero errors.
- The nav search bar shows typeahead suggestions (VS-2, VS-3).
- Selecting a suggestion or "View all results" navigates correctly (VS-4, VS-5).
- Clear control and empty state work (VS-6).
- Keyboard navigation and dismissal work (VS-7).
- Every `@US{N}` scenario in `features/search-typeahead.feature` has a corresponding integration or E2E test.