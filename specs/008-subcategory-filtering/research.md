# Research: Subcategory Filtering on Category Pages

**Feature**: 008-subcategory-filtering | **Date**: 2026-08-02

## 1. Unified Product Fetching (Parent + Subcategories)

**Decision**: Fetch all products in one request using Square's `searchCatalogItems` with all category IDs (parent + children).

**Rationale**: The `square` SDK's `catalogApi.search` accepts an array of `categoryIds`. The data layer (`lib/square/catalog.ts`) resolves the parent category by slug, collects all child category IDs via `parentCategory.id`, then queries with the combined list. Products are annotated with `subCategory`/`subCategorySlug` during the mapping phase.

**Alternatives considered**:
- Multiple sequential API calls (one per category) → rejected due to latency and Square API rate limits.
- Fetch ALL products and filter server-side → rejected due to Square pagination limits and memory concerns.

## 2. Client-Side Filter State Management

**Decision**: Use Next.js `useSearchParams` + `useRouter` for URL persistence, with `useState` for the active subcategory slug.

**Rationale**: URL search params (`?sub=strategy`) enable shareable/bookmarkable filtered views and support browser back/forward navigation. `useState` provides immediate UI updates while `router.push` syncs the URL. The component reads the initial filter from the URL on mount, validates it against available subcategories, and falls back to "All" for invalid slugs.

**Alternatives considered**:
- `nuqs` (useQueryState library) → rejected as unnecessary dependency; `useSearchParams` is built-in.
- Client-only state (no URL sync) → rejected because filtered views wouldn't be shareable.
- Server-side filtering (URL param read in RSC) → rejected because it would require a page reload on every filter change.

## 3. Pagination After Filtering

**Decision**: Client-side pagination: 12 items per page, applied after subcategory filtering. `useState` for `currentPage`, reset to page 1 when filter changes.

**Rationale**: All products are already loaded client-side (filtering is client-side per FR-005), so additional pagination is a simple `.slice()` operation. 12 items/page matches the existing `/shop/[category]` pattern.

**Alternatives considered**:
- Server-side pagination → rejected because it would require network requests on page change, conflicting with FR-005.
- Infinite scroll → rejected to maintain consistency with existing pagination pattern.

## 4. ARIA Accessibility for Filter Chips

**Decision**: Use `<button>` elements (inherently focusable and keyboard-activatable) with `aria-pressed` attribute for toggle state.

**Rationale**: `<button>` elements provide native keyboard support (Enter/Space to activate) and focus management. `aria-pressed="true|false"` communicates the selected/unselected state to screen readers. Visual highlighting via Tailwind classes provides the sighted equivalent.

**Alternatives considered**:
- `<div>` with `role="button"` and `tabIndex` → rejected as unnecessarily complex.
- Radio group pattern → rejected because "All" is a reset action, not a mutually exclusive option.

## 5. Error States for API Failures

**Decision**: Category not found → 404 via `notFound()`. API unreachable → `ErrorBanner` component with user-friendly message. Zero mock data served.

**Rationale**: Square API failures are rare but must be handled gracefully. `notFound()` triggers Next.js's built-in 404 page for invalid slugs. For transient failures, an `ErrorBanner` with an actionable message (e.g., "Unable to load products. Please try again.") is shown. No mock data fallback per Constitution VII.

**Alternatives considered**:
- Silent empty grid → rejected because it misleads users into thinking the category has no products.
- Redirect to homepage → rejected because it loses context.

## 6. Multi-Subcategory Products

**Decision**: Products tagged with multiple subcategories appear under all matching filter chips via `subCategorySlug` comparison.

**Rationale**: The filter uses `p.subCategorySlug === activeSub`, meaning a product matches whichever chip's slug it has. If Square supports multiple category assignments per item, the current implementation already handles this naturally.

**Alternatives considered**:
- Product appears only under its "primary" subcategory → rejected as arbitrary and user-hostile.
- Display a "Multiple" badge → considered but out of scope for v1.

## 7. Mobile Filter Chip Layout

**Decision**: `flex-wrap` with horizontal gap, allowing chips to wrap to multiple rows on narrow viewports.

**Rationale**: Tailwind's `flex flex-wrap gap-3` handles responsive wrapping automatically. No horizontal scroll on mobile (avoids discoverability issues). Chips remain tappable at standard touch target size (minimum 35px height).

**Alternatives considered**:
- Horizontal scroll with `overflow-x-auto` → rejected because wrapped chips are easier to scan.
- Dropdown select → rejected because chips provide immediate visibility of all options.

## 8. Invalid Subcategory URL Parameter

**Decision**: Validate the `?sub=` parameter against the `subCategories` prop. Fall back to "All" if the slug doesn't match any known subcategory.

**Rationale**: Prevents broken states from manipulated or outdated URLs. The validation on mount (`subCategories.some((s) => s.slug === initialSub)`) ensures only valid subcategories can be selected via URL.

## 9. Default Sort Order

**Decision**: Products maintain Square's default catalog ordering ("Featured" / merchant-defined). No sort dropdown on `/categories/[slug]`.

**Rationale**: Square returns items in the order configured by the merchant. This is the intended display order for a browse experience. The `/shop/[category]` route already has sort controls if needed.

## 10. Caching Strategy

**Decision**: Use Next.js ISR with `revalidate` on category pages to cache Square API responses server-side.

**Rationale**: Category page content changes infrequently. A 1-hour `revalidate` interval balances freshness with performance, reducing Square API calls. Already implemented via `export const revalidate = 3600` in existing page routes.

