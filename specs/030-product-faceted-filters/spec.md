# Feature Specification: Faceted Product Listing Filters

**Feature Branch**: `030-product-faceted-filters`

**Created**: 2026-08-06

**Status**: Draft

**Input**: User description: "The Figma has new designs for product-listing-faceted for 3 sizes. Update the product listing page to include the faceted designs and make them work. This includes facet for categories below the currently selected top category, custom attribute brand, and availability facets."

## Clarifications

### Session 2026-08-06

- Q: Should the product list be filtered against the already-loaded products on the page, or by re-querying the catalog each time a filter changes? → A: Filter client-side over the full product set already loaded for the category; instant, no extra requests.
- Q: When a product has multiple variations where some are in stock and others are sold out, should the product be considered "in stock" for the availability facet? → A: Treat a product as "in stock" if any of its variations is available.
- Q: Should the brand facet options always show every brand in the category, or should they narrow to only brands present among the products matching the other active filters? → A: Dynamically narrow the brand options to reflect the other active filters, so shoppers only see brands that still have matching products.
- Q: Should the subcategory and availability facet options also dynamically narrow to reflect the products matching the other active filters, so all three facets behave consistently? → A: Apply the same dynamic narrowing to all three facets so the store behaves consistently as a faceted-navigation experience.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and filter products by subcategory (Priority: P1)

A shopper lands on a category listing page (e.g., Miniatures) and wants to narrow down to a specific subcategory (e.g., Warhammer 40K). They see the subcategories below the currently selected top category and can select one to narrow the product list.

**Why this priority**: This is the core faceted filtering behavior and the primary way shoppers locate products within a category. It builds directly on the existing subcategory data already available to the listing page.

**Independent Test**: Can be fully tested by navigating to any category page, selecting a subcategory facet, and confirming the product grid updates to show only matching products.

**Acceptance Scenarios**:

1. **Given** a shopper is on a category listing page, **When** they apply a subcategory filter, **Then** the product list shows only products belonging to that subcategory.
2. **Given** a shopper has a subcategory filter applied, **When** they clear/remove the filter, **Then** the full product list for the category is restored.
3. **Given** a shopper is on a category listing page, **When** the page loads, **Then** the subcategory facet is pre-populated with all subcategories below the currently selected top category.
4. **Given** a subcategory has no products assigned directly to it but has its own sub-subcategories that hold products, **When** the shopper opens the category listing page, **Then** the subcategory is still displayed as a facet option and products in its sub-subcategories are fetched and shown; **And** when the shopper selects that subcategory filter, the product list shows the products from its sub-subcategories.
5. **Given** a subcategory has its own child subcategories, **When** the shopper selects that subcategory, **Then** its child subcategories are revealed as a second (indented/drill-down) level in the subcategory facet and the product list filters to all products under that subcategory (subcategory and its descendants); **And** when the shopper selects one of the revealed child subcategories, the product list filters to that child subcategory's products only.
6. **Given** a shopper has selected a subcategory (revealing its children) and then selects one of those child subcategories, **Then** the parent subcategory's children REMAIN visible (stay expanded) in the facet while the product list filters to the selected child's products only. The drill-down expansion state is separate from the single-select filter: selecting a child keeps its ancestor path expanded rather than collapsing the parent.

---

### User Story 2 - Filter products by brand (Priority: P1)

A shopper wants to see only products from a specific manufacturer (brand). They select a brand from a brand facet, and the product list narrows to products carrying that brand custom attribute.

**Why this priority**: Brand filtering is a primary shopping behavior requested in the faceted design. It requires surfacing a per-product brand value that is not currently available to the listing page, so it is a key data addition.

**Independent Test**: Can be fully tested by selecting a brand facet and confirming only products with that brand remain visible.

**Acceptance Scenarios**:

1. **Given** products in a category carry a brand, **When** a shopper selects a specific brand, **Then** the product list shows only products with that brand.
2. **Given** a shopper has selected a brand, **When** they select a second brand, **Then** the product list includes products matching either selected brand.
3. **Given** a shopper has brand filters applied, **When** they clear all brand filters, **Then** all products in the category are shown again.

---

### User Story 3 - Filter products by availability (Priority: P2)

A shopper wants to see only products that are currently in stock. They toggle an availability facet (e.g., In Stock / Out of Stock) and the product list narrows accordingly.

**Why this priority**: Availability filtering is valuable but depends on availability data being surfaced to the listing page, which is currently only available on the product detail page. It is a secondary behavior after subcategory and brand.

**Independent Test**: Can be fully tested by selecting "In Stock" and confirming out-of-stock products disappear from the list, and selecting "Out of Stock" and confirming the reverse.

**Acceptance Scenarios**:

1. **Given** a category contains both in-stock and out-of-stock products, **When** a shopper selects "In Stock", **Then** only in-stock products are shown.
2. **Given** a shopper selects "Out of Stock", **When** the list updates, **Then** only out-of-stock products are shown.
3. **Given** a shopper has an availability filter applied, **When** they clear it, **Then** all products in the category are shown again.

---

### User Story 4 - Use faceted filters across all screen sizes (Priority: P2)

A shopper uses the faceted product listing on desktop (large), tablet (medium), and mobile (small). On each size the filters are presented per the new design: a left sidebar on large screens (beside the product results), a horizontal filter strip on medium screens, and a filter toggle with category chips on small screens.

**Why this priority**: The faceted design defines explicit responsive layouts for three breakpoints. Supporting all three ensures the feature works for every shopper regardless of device.

**Independent Test**: Can be fully tested by viewing the listing page at large, medium, and small widths and confirming the correct filter presentation for each.

**Acceptance Scenarios**:

1. **Given** a shopper views the listing on a large screen, **When** the page renders, **Then** filters appear in a persistent left sidebar positioned to the LEFT of the product results, alongside the product grid.
2. **Given** a shopper views the listing on a medium screen, **When** the page renders, **Then** filters appear as a horizontal strip above the product grid.
3. **Given** a shopper views the listing on a small screen, **When** the page renders, **Then** a filter toggle with an active-filter count is shown and category filters appear as chips.
4. **Given** a subcategory has its own child subcategories, **When** the shopper browses the listing on a medium or small screen (via the horizontal strip or the filter toggle), **Then** selecting that subcategory reveals its child subcategories as a second (indented) level, consistent with the large-screen sidebar drill-down, and the product list filters to all products under that subcategory (subcategory and its descendants).
5. **Given** a shopper views the listing on a large screen, **When** the page renders, **Then** no Price Range facet is shown in the sidebar — the sidebar contains only the Categories, Brand, and Availability facets.

---

### Edge Cases

- What happens when a category has no subcategories? The subcategory facet should be hidden or show no options rather than an empty state.
- What happens when a subcategory has no products directly assigned to it but has its own sub-subcategories holding products (e.g., "Games Workshop" under Miniatures)? The subcategory must still display as a facet option, its descendant products must be fetched recursively, and selecting it must show the products from its sub-subcategories.
- What happens when a subcategory has its own child subcategories? Selecting the subcategory reveals its children as a drill-down second level and filters to all products under it (subcategory + descendants); selecting a child filters to that child's products only. Selecting a child does NOT collapse the parent — the parent's children remain expanded so the shopper can continue drilling deeper.
- What happens when no products carry a brand value? The brand facet should be hidden or show no options.
- What happens when a selected filter combination returns zero products? The page should show a clear empty state with an option to clear filters.
- What happens when a filter with an active count is deselected? The active-filter count badge should update immediately.
- What happens when availability data is missing for a product? The product should be treated as available (in stock) or excluded from the availability facet rather than producing an error.
- What happens when the user navigates directly to a URL carrying filter parameters? The applied filters should be reflected in the displayed product list.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product listing page MUST display a subcategory facet populated with the subcategories below the currently selected top-level category, including subcategories that have no directly-assigned products but whose sub-subcategories hold products.
- **FR-001a**: The subcategory facet MUST support a hierarchical drill-down: selecting a subcategory reveals its child subcategories as a second (indented) level, and selecting any node filters the product list to all products under that node (node and its descendants). This MUST work on BOTH listing routes — `/categories/[slug]` and `/shop/[category]` — each of which MUST supply the full subcategory tree so the drill-down behaves identically. **Drill-down expansion MUST be separate from the single-select filter**: when a shopper selects a child subcategory, the parent's children MUST remain revealed (the ancestor path stays expanded) rather than collapsing, while the product list filters to the selected child's products only.
- **FR-002**: The product listing page MUST allow the shopper to select and deselect subcategory filters, updating the visible product list accordingly.
- **FR-003**: The product listing page MUST display a brand facet populated with the distinct brand values present among the currently filtered product set, narrowing dynamically as other active filters are applied.
- **FR-004**: The product listing page MUST allow the shopper to select one or more brand filters, and the product list MUST include products matching any selected brand.
- **FR-005**: The product listing page MUST display an availability facet allowing the shopper to filter by in-stock and/or out-of-stock products, classifying a product as "in stock" if any of its variations is available.
- **FR-006**: The product listing page MUST combine all active filters (subcategory, brand, availability) so the product list reflects all applied criteria simultaneously, and MUST dynamically narrow the available options across all three facets as filters are applied.
- **FR-007**: The product listing page MUST show a count of active filters and allow the shopper to clear individual or all active filters.
- **FR-008**: The product listing page MUST render the faceted filter layout differently per screen size: a left sidebar on large screens, a horizontal filter strip on medium screens, and a filter toggle with category chips on small screens.
- **FR-008a**: The subcategory facet's hierarchical drill-down (selecting a parent reveals its children) MUST work consistently across ALL breakpoints — the large-screen sidebar, the medium-screen horizontal strip, and the small-screen filter toggle — so a shopper can reveal child subcategories at any screen size.
- **FR-009**: The product listing page MUST apply filters client-side over the full product set already loaded for the category, so filtering is instant without additional catalog requests.
- **FR-010**: The product listing page MUST surface a per-product brand value and availability status so the brand and availability facets can operate.
- **FR-011**: When the combination of active filters returns no products, the page MUST display a clear empty state with a way to clear the active filters.
- **FR-012**: The product listing page MUST show the correct count of matching results in the results bar as filters are applied or removed.
- **FR-013**: On the large-screen (lg) layout, the faceted sidebar MUST be positioned to the LEFT of the product results within a single horizontal row, with a 280px sidebar and the product grid column to its right.
- **FR-014**: The faceted sidebar MUST NOT include a Price Range facet; it contains only the Categories, Brand, and Availability facet groups. The Price Range facet is intentionally removed from the feature entirely.
- **FR-015**: The product detail page breadcrumb MUST show the full category path from the top-level category down to the product's own category. The top-level segment MUST link to a valid `/categories/<top-level-slug>` listing route (never a 404 for a subcategory slug). Intermediate subcategory segments MAY link to the top-level listing with a sub filter (e.g. `/categories/<top-slug>?sub=<sub-slug>`); the product title is the final, non-link segment.
- **FR-016**: When a product is assigned to MULTIPLE Square categories, the product detail breadcrumb MUST NOT default to the first assigned category (`categories[0]`). It MUST select a category that is part of the visible (channel-filtered) hierarchy and resolves up to an allowlisted top-level category, preferring the deepest/most specific valid category. If no assigned category resolves to an allowlisted top-level category, the breadcrumb falls back to "Uncategorized".
- **FR-017**: The product listing page MUST display each product's real image from the live Square catalog. The listing MUST resolve image URLs from the item's `itemData.imageIds` (falling back to variation-level `itemVariationData.imageIds`) by `batchGet`-ing the IMAGE catalog objects and reading their `imageData.url`, and assign the first available URL to the product. Products with no images MUST keep an empty image so the card renders its gradient placeholder.
- **FR-018**: The product card image area MUST scale proportionally with the viewport/column width. It MUST use an aspect-ratio-based container (e.g. `aspect-[4/3]`) rather than a fixed pixel height, so the image does not crop or distort as the viewport changes size.

### Key Entities *(include if feature involves data)*

- **Subcategory Facet**: A list of subcategory options below the selected top-level category; each option filters products by their subcategory membership. Each subcategory has a name and slug.
- **Brand Facet**: A list of brand values; each brand is a custom attribute value carried by products. A product may have zero or one brand. Multiple brands may be selected.
- **Availability Facet**: A set of availability states (e.g., in stock, out of stock) that a product falls into based on its inventory status.
- **Active Filter**: A representation of one applied filter (subcategory, brand, or availability) that can be counted and cleared.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A shopper can apply any combination of subcategory, brand, and availability filters and see the product list update within 1 second of the filter selection.
- **SC-002**: Applying a single filter reduces the displayed product list to exactly the products matching that filter, verifiable by comparing the result count to the known matching products.
- **SC-003**: The active-filter count displayed to the shopper always matches the number of filters they have applied.
- **SC-004**: The faceted layout renders correctly at all three screen sizes (large, medium, small) with no horizontal overflow or hidden filter controls; on large screens the 280px sidebar appears to the LEFT of the product results in a single horizontal row.
- **SC-005**: A shopper can clear all applied filters and restore the full category product list with a single action.

## Assumptions

- The subcategory data required for the subcategory facet is already available to the listing page and will be reused.
- A product's brand is represented as a custom attribute value in the catalog; products without a brand value will simply not appear under any brand option.
- A product's availability is determined consistently with the existing availability logic used on the product detail page; a product is considered "in stock" when any of its variations is available.
- The faceted filter design applies to the existing category product listing page (e.g., `/shop/[category]`), replacing the current filter bar presentation.
- Filter selections are intended to be shared in the URL so they can be preserved across navigation and page reloads.
- The three screen sizes correspond to the existing responsive breakpoints used by the site (large ≈ desktop, medium ≈ tablet, small ≈ mobile).