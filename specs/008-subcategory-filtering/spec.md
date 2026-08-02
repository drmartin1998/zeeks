# Feature Specification: Subcategory Filtering on Category Pages

**Feature Branch**: `008-subcategory-filtering`

**Created**: 2026-08-02

**Status**: Draft

**Input**: User description: "as a user I want to filter category pages by subcategories"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse All Products in a Category Including Subcategories (Priority: P1)

As a shopper browsing the online store, when I visit a top-level category page (e.g., "Board Games"), I want to see every product belonging to that category and any of its subcategories (e.g., "Strategy", "Family", "Cooperative") in a single unified view, so I can discover the full range of available products without needing to click into each subcategory separately.

**Why this priority**: This is the foundation for subcategory filtering. Without it, users see only directly-tagged products and must manually explore each subcategory. It delivers immediate value by removing unnecessary navigation steps.

**Independent Test**: Visit `/categories/board-games`. Count all products displayed. Verify that count equals the sum of products tagged with "Board Games" directly plus products tagged with "Strategy", "Family", "Cooperative", and any other child subcategories. This can be tested without any filter UI.

**Acceptance Scenarios**:

1. **Given** a top-level Square category "Board Games" exists with subcategories "Strategy" and "Family", each containing products, **When** a shopper visits `/categories/board-games`, **Then** products from the parent category, the "Strategy" subcategory, and the "Family" subcategory are all displayed together in the product grid.
2. **Given** a top-level category "Miniatures" exists with no subcategories, **When** a shopper visits `/categories/miniatures`, **Then** only "Miniatures" products are displayed (no change from basic category behavior).
3. **Given** a top-level category "Supplies" exists with subcategories but zero total products, **When** a shopper visits `/categories/supplies`, **Then** an appropriate empty state message is displayed (e.g., "No products found in this category yet").

---

### User Story 2 - Filter Products by Subcategory (Priority: P2)

As a shopper viewing a unified category page, I want to click on subcategory filter chips (e.g., "Strategy", "Family", "Cooperative") to narrow the product grid to only products from a specific subcategory, so I can focus on the type of products I'm interested in without leaving the page.

**Why this priority**: Filtering builds on the unified view (P1) to add precision. It transforms a browse experience into a targeted search. Valuable but requires P1 as a prerequisite.

**Independent Test**: Visit `/categories/board-games`. Verify filter chips appear for each subcategory ("All", "Strategy", "Family", "Cooperative"). Click "Strategy" — verify only Strategy-tagged products remain visible. Click "All" — verify all products return. Test on a category with no subcategories — verify no filter chips appear.

**Acceptance Scenarios**:

1. **Given** the shopper is viewing `/categories/board-games` which has subcategories "Strategy" and "Family", **When** the page loads, **Then** filter chips labeled "All", "Strategy", and "Family" are displayed above the product grid, with "All" pre-selected.
2. **Given** the shopper is viewing the unified category with "All" selected, **When** the shopper clicks the "Strategy" chip, **Then** the "All" chip becomes deselected, the "Strategy" chip becomes highlighted/selected, and only products belonging to the "Strategy" subcategory are shown.
3. **Given** the shopper has the "Strategy" filter chip active, **When** the shopper clicks the "All" chip, **Then** the subcategory filter is cleared and all products from all subcategories are displayed again.
4. **Given** a category has no subcategories (e.g., "Miniatures"), **When** the shopper visits that category page, **Then** no subcategory filter chips are displayed.

---

### User Story 3 - Preserve Filter State for Shareability (Priority: P3)

As a shopper who has filtered a category page by subcategory, I want the active filter to be reflected in the page URL so I can bookmark the filtered view, share it with friends, or use browser back/forward navigation naturally.

**Why this priority**: Enhances usability and shareability. Not required for core filtering functionality, but important for a polished experience.

**Independent Test**: Visit `/categories/board-games`, click "Strategy" chip. Verify the URL updates to something like `/categories/board-games?sub=strategy`. Copy the URL, open in a new tab — verify the "Strategy" filter is still active and only Strategy products are shown. Click browser back — verify the filter returns to "All".

**Acceptance Scenarios**:

1. **Given** the shopper is viewing `/categories/board-games` with "All" active, **When** the shopper clicks the "Strategy" chip, **Then** the browser URL updates to include a `?sub=strategy` query parameter.
2. **Given** a URL `/categories/board-games?sub=strategy` is opened directly, **When** the page loads, **Then** the "Strategy" filter chip is pre-selected and only Strategy products are displayed.
3. **Given** the shopper has filtered to "Strategy" then "Family" via chips, **When** the shopper presses the browser back button, **Then** the previous filter state ("Strategy") is restored along with the corresponding URL.

---


---

### Edge Cases

- What happens when a product belongs to multiple subcategories? The product appears under whichever single filter is currently active — only one subcategory filter can be applied at a time (single-select behavior).
- What happens when a subcategory filter yields zero products? Display a contextual message ("No products in this subcategory") with a clear action to return to the full view.
- What happens when a category has a very large number of products (e.g., 500+)? Pagination should limit the visible products per page (e.g., 12 per page) to maintain performance.
- What happens on mobile viewports? Filter chips should remain accessible — either as a horizontally scrollable row or wrapped layout.
- What happens when a category slug in the URL does not match any Square category? A 404 page should be displayed.
- What happens when the Square API is unreachable? The category page should gracefully show an error state rather than crashing or showing stale/mock data.
- What happens when a category URL has an invalid or non-existent subcategory slug in the `?sub=` parameter? Treat it as if no subcategory filter is active (show "All").

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST fetch and display products from a parent Square category AND all of its child subcategories when a shopper visits a category page.
- **FR-002**: System MUST display subcategory filter chips (pill-shaped buttons) above the product grid when the current category has one or more subcategories.
- **FR-003**: An "All" filter chip MUST be displayed as the first chip and selected by default, showing the full unfiltered product set.
- **FR-004**: Clicking a subcategory filter chip MUST filter the visible products to only those whose subcategory matches the selected chip.
- **FR-005**: Subcategory filtering MUST operate entirely on the client side (no additional network requests when toggling filters).
- **FR-006**: Each product card in the grid MUST display its subcategory association (e.g., as a label or badge) when the product belongs to a subcategory.
- **FR-007**: The active subcategory filter MUST be reflected in the page URL as a query parameter (`?sub=<subcategory-slug>`), enabling bookmarking, sharing, and browser back/forward support.
- **FR-008**: When a subcategory filter is active and yields zero visible products, the UI MUST display a contextual empty state message ("No products in this subcategory") with a clearly labeled action button to clear the filter and show all products.
- **FR-009**: Category pages MUST support pagination (e.g., 12 products per page) when the total product count exceeds one page, applied after any active subcategory filter.
- **FR-010**: The default product sort order on category pages MUST follow the merchant-defined ordering from Square (i.e., "Featured" order).
- **FR-011**: System MUST NOT fall back to hardcoded or mock data in production. All product and category data MUST come from the Square Catalog API.
- **FR-012**: When the Square API is unreachable or returns an error, the category page MUST return an appropriate error state (404 for unrecognized categories, error message for transient failures) rather than displaying mock data.
- **FR-013**: The subcategory filter UI MUST be accessible: chips must be keyboard-navigable, focusable, and have appropriate ARIA labels indicating their selected/unselected state.

### Key Entities

- **Category**: A top-level grouping from the Square Catalog (e.g., "Board Games", "Miniatures"). Has a name, slug, and optional image. May have child subcategories.
- **Subcategory**: A child category within a parent Square Catalog category (e.g., "Strategy" under "Board Games"). Identified by a `parentCategory.id` relationship. Has a name and slug.
- **Product**: An item from the Square Catalog with title, slug, price, image, and category/subcategory associations. A product may belong to one or more categories/subcategories.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Shoppers can view all products in a category and its subcategories on a single page without navigating to separate subcategory pages.
- **SC-002**: Subcategory filter toggles respond instantly (under 100ms perceived latency) since filtering is client-side with no network requests.
- **SC-003**: Filtered category page views are shareable via URL — copying and pasting a URL with a `?sub=` parameter into a new browser tab restores the exact filtered view.
- **SC-004**: Category pages with up to 100 products load within 3 seconds (including product data retrieval from the catalog).
- **SC-005**: Zero mock or hardcoded product data is served to shoppers in production under any error condition.
- **SC-006**: Shoppers can complete the task of finding a subcategory-specific product within 3 interactions: visit category page → click subcategory chip → view product.

## Assumptions

- Product categories use a parent-child hierarchy where child categories (subcategories) reference their parent, enabling the system to identify which subcategories belong to each top-level category.
- Products are tagged with category identifiers, and a product can belong to both a parent category and a subcategory simultaneously.
- The product catalog data source supports querying by multiple category groupings in a single request, enabling a single fetch for parent and all child subcategories.
- Subcategories are managed by store administrators through the product catalog management system, not hardcoded in the application.
- The existing category page routes will both benefit from this feature.
- The existing pagination approach (12 items per page) and UI component patterns will be reused.
- Browser support includes modern evergreen browsers (Chrome, Firefox, Safari, Edge) with JavaScript enabled.
- Mobile responsiveness is required but complex mobile-specific interactions (e.g., swipe gestures) are out of scope for v1.
