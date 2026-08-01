# Research: Subcategory Browsing & Filtering

**Date**: 2026-08-01

## 1. Square API Pagination for searchItems

**Decision**: Implement cursor-based pagination with `limit: 1000`

**Rationale**: Square's `searchItems` endpoint defaults to 100 results per page and returns a `cursor` for pagination. Categories with >100 items (common for Miniatures with subcategories) were silently truncating results at page 1. Setting `limit: 1000` minimizes round-trips while staying within Square's limits. The loop continues until `cursor` is undefined.

**Alternatives considered**:
- `limit: 500` (more round-trips) — rejected for performance
- `limit: 10000` (may exceed Square max) — rejected for safety

## 2. Single fetchAllCategories() for Deduplication

**Decision**: Extract `fetchAllCategories()` as a private helper used by all category-fetching functions

**Rationale**: `getSquareCategories()`, `getSquareCategoryBySlug()`, `getSquareSubcategories()`, and `getSquareProductsByCategorySlug()` all need the full category list. Making 4 separate `catalogApi.search()` calls per page request is wasteful. The single `fetchAllCategories()` call stores results in module scope and is reused.

**Alternatives considered**:
- Per-function API calls (simpler but wasteful) — rejected for performance
- Server-side caching (complexity) — deferred to Phase 2

## 3. Client-Side Subcategory Filtering

**Decision**: Filter products client-side by `subCategorySlug` using React state

**Rationale**: All products (parent + subcategories) are fetched server-side in one call. Filtering client-side avoids additional network requests and provides instant (<16ms) toggle response. Single-select behavior (clicking one chip deselects others) keeps the UI simple.

**Alternatives considered**:
- URL search params (SSR-friendly but slower toggles) — rejected for UX
- Multi-select filters (complexity for v1) — rejected for simplicity

## 4. Subcategory Annotation on Products

**Decision**: Match each item's `itemData.categories` array against the subcategory ID map

**Rationale**: Square items reference categories by ID in their `categories` field. Building a `Map<string, SquareSubCategory>` during the category resolution phase allows O(1) lookup when annotating products. Products with no subcategory match get `subCategory: undefined`.

**Alternatives considered**:
- Fetching items per subcategory separately (N+1 API calls) — rejected

## 5. No Mock Data Fallback

**Decision**: Remove all hardcoded data fallbacks from production code

**Rationale**: Per the "No Mock Data in Production" rule, all data must come from Square. On API failure, show graceful error states (404, hidden sections, empty nav). Hardcoded data remains in `lib/data.ts` and `lib/data/products.ts` for test usage only.

**Alternatives considered**:
- Keep fallbacks with warning logs — rejected (violates rule)
- Hybrid approach with stale-while-revalidate — deferred to future

## 6. URL-Based Filter State (FR-012)

**Decision**: Reflect active subcategory filter in the URL as `?sub=<slug>` search param using Next.js `useSearchParams`

**Rationale**: URL state is shareable, bookmarkable, and supports browser back/forward navigation. Next.js provides `useSearchParams` natively in client components; the server component passes the initial value via props.

**Alternatives considered**:
- React state only — rejected (filter lost on refresh, no shareability)
- URL path segment (`/categories/board-games/strategy`) — rejected (requires new route, complex)

## 7. Filter Zero-Results UI (FR-013)

**Decision**: Show contextual empty state: "No products in this subcategory" with a "Show all" button

**Rationale**: A generic "no products" message is confusing when it only applies to a filtered subset. The contextual message + clear action button prevents user confusion and provides a single-click path back to the full view.

**Alternatives considered**:
- Auto-revert to "All" — rejected (disorienting, no user control)
- Generic "No products found" — rejected (no differentiation from unfiltered empty)

## 8. Categories/[slug] Pagination (FR-014)

**Decision**: Add pagination (12 items/page, page number nav) matching `/shop/[category]` style, applied after subcategory filtering

**Rationale**: With cursor pagination at the API layer now fetching ALL items, a category could have 500+ products. Rendering all in one grid is a performance and UX problem. The existing `Pagination` component from `ProductListingPage` is reusable.

**Alternatives considered**:
- No pagination — rejected (performance for large categories)
- Infinite scroll — rejected (no existing pattern in app, harder to implement)

## 9. Default Sort Order (FR-015)

**Decision**: "Featured" — Square's default catalog ordering. No sort dropdown on `/categories/[slug]`.

**Rationale**: Simplicity wins for the lighter category page. Square's default ordering lets merchants control merchandising. Users who need sorting can use `/shop/[category]` which has a full sort dropdown.

**Alternatives considered**:
- Alphabetical — rejected (not merchant-controlled)
- Add sort dropdown — rejected (overcomplicates the simpler page; `/shop/[category]` already has this)
