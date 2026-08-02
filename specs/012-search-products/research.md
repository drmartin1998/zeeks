# Research: Product Search

**Feature**: 012-search-products
**Date**: 2026-08-02

## 1. Square Search API

**Decision**: Use `catalogApi.searchItems({ textFilter, enabledLocationIds })` for keyword search.

**Rationale**: Square's `SearchCatalogItems` supports `textFilter` which matches against item name, description, and variation name. The existing search Route Handler already uses this pattern. Adding `enabledLocationIds` scopes results to the configured location.

## 2. Page Architecture

**Decision**: Server Component calling `searchProductsByQuery()` directly — no self-referencing `fetch()`.

**Rationale**: Next.js blocks `fetch()` to its own routes during SSR. Direct function calls avoid this. The existing Route Handler at `/api/catalog/products/search` is preserved for client-side use.

## 3. Search Bar Wiring

**Decision**: Add `useState` + `useRouter` to the nav bar's search input to navigate on form submit.

**Rationale**: The nav bar already has a styled search input. Adding controlled state and a submit handler is the minimal change. Navigation uses `router.push()` to maintain SPA transitions.
