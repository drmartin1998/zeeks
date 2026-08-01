# Feature Specification: Subcategory Browsing & Filtering

**Feature Branch**: `003-subcategory-filtering`

**Created**: 2026-08-01

**Status**: Implemented

**Input**: User description: "When viewing a top category I want to see all products in that category and any subcategories with the ability to filter by subcategories."

## Clarifications

### Session 2026-08-01

- Q: Should the active subcategory filter be reflected in the URL for shareability/bookmarking? → A: URL search params (`?sub=strategy`) — shareable, bookmarkable, supports back/forward
- Q: Should subcategory filter chips display product counts? → A: No counts — simpler UI, less visual noise, chips are just label buttons
- Q: What should display when a subcategory filter yields zero products? → A: "No products in this subcategory" message with a "Show all" button to clear the filter and return to full view
- Q: Should `/categories/[slug]` add pagination given it now fetches all items from Square? → A: Yes — pagination matching `/shop/[category]` style (page numbers, 12 items per page)
- Q: What default sort order should `/categories/[slug]` use? → A: "Featured" — Square's default catalog ordering, merchant-controlled, no sort dropdown needed on this route

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View All Products Including Subcategories (Priority: P1)

As a customer browsing the online store, when I navigate to a top-level category page (e.g., "Board Games"), I want to see ALL products in that category AND any products in its subcategories (e.g., "Strategy", "Family", "Cooperative"), so I don't have to click into each subcategory individually to discover products.

**Why this priority**: This is the core value proposition — without it, users see an incomplete category page and must navigate subcategory-by-subcategory.

**Independent Test**: Navigate to `/categories/board-games` and verify products tagged with both the parent category and any subcategories appear in the grid. Product count should equal parent + all subcategory products.

**Acceptance Scenarios**:

1. **Given** a top-level category "Board Games" exists with subcategories "Strategy" and "Family", **When** a user visits `/categories/board-games`, **Then** products from all three categories (Board Games, Strategy, Family) are displayed in the product grid.
2. **Given** a top-level category "Miniatures" exists with NO subcategories, **When** a user visits `/categories/miniatures`, **Then** only Miniatures products are displayed.
3. **Given** a top-level category "Supplies" exists with subcategories but NO products, **When** a user visits `/categories/supplies`, **Then** an appropriate empty state message is shown ("No products found in this category yet").

---

### User Story 2 - Filter by Subcategory (Priority: P2)

As a customer viewing a category page, I want to see subcategory filter chips (like "All", "Strategy", "Family") so I can quickly narrow down products to a specific sub-type without leaving the page.

**Why this priority**: Filtering adds refinement once the full product set is visible. It's valuable but depends on P1 (all products being loaded).

**Independent Test**: Navigate to `/categories/board-games`, verify filter chips appear for each subcategory. Click a subcategory chip and verify only products from that subcategory remain visible. Click "All" and verify all products return.

**Acceptance Scenarios**:

1. **Given** the user is viewing `/categories/board-games` which has subcategories "Strategy" and "Family", **When** the page loads, **Then** filter chips labeled "All", "Strategy", and "Family" are displayed above the product grid.
2. **Given** "Strategy" chip is clicked, **When** the chip becomes active, **Then** only Strategy products are shown and "All" deselects.
3. **Given** the user has filtered to "Strategy", **When** "All" is clicked, **Then** all products from all subcategories and parent are shown again.
4. **Given** a category has NO subcategories, **When** the page loads, **Then** no subcategory filter chips are displayed.
5. **Given** the user has filtered to "Strategy", **When** the URL is refreshed or shared, **Then** the page loads with "Strategy" chip active and only Strategy products shown.
6. **Given** a subcategory filter returns zero products, **When** the filter is applied, **Then** an empty state shows "No products in this subcategory" with a "Show all" button that clears the filter.

---

### User Story 3 - Graceful Degradation Without Mock Data (Priority: P3)

As a platform operator, when the Square API is unreachable, I want the application to show graceful error states (404, empty nav, hidden sections) rather than silently falling back to hardcoded mock data, so that users see accurate information and we detect issues immediately.

**Why this priority**: Infrastructure reliability — ensures production never serves stale/mock data, making issues visible and ensuring data integrity.

**Independent Test**: Simulate Square API downtime and verify category pages return 404, navbar shows only static links (About Us, Locations, Sale), and homepage hides Featured Categories/Featured Games sections.

**Acceptance Scenarios**:

1. **Given** the Square Catalog API is unreachable, **When** a user visits `/categories/board-games`, **Then** a 404 page is shown (not mock products).
2. **Given** the Square Catalog API is unreachable, **When** any page renders, **Then** the navigation bar shows only static links ("About Us", "Locations", "Sale") — no fake product categories.
3. **Given** the Square Catalog API is unreachable, **When** the homepage loads, **Then** the Featured Categories and Featured Games sections are hidden.

---

### Edge Cases

- What happens when a category slug in the URL does not match any Square category? → 404 via `notFound()`
- What happens when Square API returns a category but searchItems returns zero results? → Empty state with message
- What happens when a product belongs to multiple subcategories? → Product appears under all matching filter chips
- What happens when a category has more than 100 items (Square's default page size)? → Cursor-based pagination fetches all pages until no cursor remains
- What happens when a filtered view has >12 products? → Pagination splits into pages of 12; page controls appear below the grid
- What about mobile viewport? → Filter chips wrap horizontally in a scrollable row

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST fetch products from a parent Square category AND all its child subcategories.
- **FR-002**: System MUST display subcategory filter chips above the product grid when subcategories exist.
- **FR-003**: "All" chip MUST be selected by default, showing all products from parent and subcategories.
- **FR-004**: Selecting a subcategory chip MUST filter products to only those with matching subCategorySlug.
- **FR-005**: Filtering MUST be client-side (no additional API calls).
- **FR-006**: Products MUST show subcategory association in the card label.
- **FR-007**: System MUST NOT fall back to hardcoded/mock data in production code paths.
- **FR-008**: When Square API is unreachable, category listing pages MUST return 404.
- **FR-009**: NavBar MUST require categories as explicit prop; no mock data import.
- **FR-010**: Homepage Featured sections MUST hide when Square data is unavailable.
- **FR-011**: Both `/categories/[slug]` and `/shop/[category]` routes MUST support subcategory filtering.
- **FR-012**: Active subcategory filter MUST be reflected in the URL as a `?sub=<slug>` search param, enabling shareable/bookmarkable filtered views.
- **FR-013**: When a subcategory filter yields zero products, the UI MUST show a contextual empty state ("No products in this subcategory") with a "Show all" button to clear the filter.
- **FR-014**: `/categories/[slug]` route MUST implement pagination matching `/shop/[category]` style (12 items per page, page number navigation), applicable after subcategory filtering.
- **FR-015**: `/categories/[slug]` default product sort order MUST be "Featured" (Square's default catalog ordering); no sort dropdown required on this route.

### Out of Scope (v1)

- Subcategory filter chips do NOT display product counts (deferred to potential v2)

### Key Entities

- **SquareCategory**: Top-level Square Catalog category (title, slug, image, href).
- **SquareSubCategory**: Child category (id, name, slug) identified by parentCategoryId.
- **SquareProduct**: Item from Square Catalog with title, category, categorySlug, optional subCategory/subCategorySlug, price, image, gradient.
- **NavCategory**: Navigation link (label, href, optional highlight).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Category page with subcategories loads within 3 seconds (includes Square API calls).
- **SC-002**: Subcategory filter toggle is instantaneous (client-side, no network request).
- **SC-003**: Zero mock data imports in non-test production files.
- **SC-004**: When Square API is down, zero mock products served to users.
- **SC-005**: Both `/categories/[slug]` and `/shop/[category]` support subcategory filtering.

## Assumptions

- Square Catalog categories have parent-child hierarchy via `parentCategoryId`.
- Square items are tagged with category IDs in `itemData.categories` array.
- Square API `searchItems` accepts multiple `categoryIds` in a single request.
- Subcategories are Square-managed, not hardcoded.
- "Sale" and "New Arrivals" nav items are static application links.
- Existing `FilterBar` component can be extended for dynamic subcategory chips.
