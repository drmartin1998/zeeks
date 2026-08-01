# Feature Specification: Square Product Display

**Feature Branch**: `004-square-product-display`

**Created**: 2026-08-01

**Status**: Draft

**Input**: User description: "products are not displaying from square at all"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Products Display on Category Pages (Priority: P1)

As a customer browsing the Zeeks store, when I visit any category page (e.g., `/categories/board-games`, `/shop/miniatures`), I expect to see product cards displayed with titles, prices, and images pulled from the Square catalog — not empty grids or error messages.

**Why this priority**: Without products displaying, the store is non-functional. This is the core user experience.

**Independent Test**: Navigate to `/categories/board-games` and verify product cards render with title, price, and image content from Square.

**Acceptance Scenarios**:

1. **Given** the Square API is available and has catalog items, **When** a user visits `/categories/board-games`, **Then** product cards are rendered showing titles, prices, and images from Square.
2. **Given** the Square API is available and has catalog items, **When** a user visits `/shop/miniatures`, **Then** product cards are rendered with sorting, filtering, and pagination.
3. **Given** a category exists in Square but has zero items, **When** a user visits that category page, **Then** an empty state message is shown ("No products found in this category yet").

---

### User Story 2 - Featured Products on Homepage (Priority: P2)

As a customer landing on the Zeeks homepage, I expect to see featured product cards in the "New Arrivals" section pulled from the Square catalog, so I can discover products immediately.

**Why this priority**: The homepage is the entry point for most users; showing products there drives engagement. Depends on US1 (product data working).

**Independent Test**: Visit the homepage and verify the "New Arrivals" section renders product cards with titles, prices, and images from Square.

**Acceptance Scenarios**:

1. **Given** the Square API is available, **When** the homepage loads, **Then** the "New Arrivals" section displays product cards from Square.
2. **Given** the Square API is unreachable, **When** the homepage loads, **Then** the "New Arrivals" section is hidden (not showing empty or mock data).

---

### User Story 3 - Product Card Data Accuracy (Priority: P3)

As a customer, when I view product cards, I expect accurate data: the correct title from Square, the correct price (converted from cents to dollars), and subcategory labels where applicable.

**Why this priority**: Data accuracy is essential for trust, but depends on products rendering first (US1).

**Independent Test**: Compare a product card on the site against the corresponding item in the Square Dashboard to verify title, price, and category match.

**Acceptance Scenarios**:

1. **Given** a Square item "Catan" priced at $39.99 (3999 cents), **When** displayed on the site, **Then** the card shows title "Catan" and price "$39.99".
2. **Given** a Square item belongs to a subcategory "Strategy" under parent "Board Games", **When** displayed on the site, **Then** the card shows category label "Board Games — Strategy".
3. **Given** a Square item has zero price (free), **When** displayed on the site, **Then** the card shows "$0.00".

---

### Edge Cases

- What happens when a Square item has no variations? → Show item with $0.00 price (still display the card)
- What happens when Square returns items but the image URL is empty? → Show gradient placeholder instead
- What happens when Square API times out? → Category page returns 404; homepage hides product sections
- What happens when a Square item's name is extremely long? → Card title truncates gracefully with CSS

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST fetch catalog items from Square API for each category listing page.
- **FR-002**: Product cards MUST display item title from `itemData.name`.
- **FR-003**: Product cards MUST display price derived from the first item variation's `priceMoney.amount`, converted from cents to dollars.
- **FR-004**: Product cards MUST display a gradient placeholder when no image is available.
- **FR-005**: System MUST fetch items using cursor-based pagination (`limit: 1000`) to handle categories with >100 products.
- **FR-006**: Homepage MUST display featured products from Square in the "New Arrivals" section.
- **FR-007**: When Square API is unreachable, category pages MUST return 404 and homepage MUST hide product sections (no mock data).

### Key Entities

- **SquareItem**: A catalog object with `type: "ITEM"`, containing `itemData.name`, `itemData.categories[]`, `itemData.variations[]`, `imageId`.
- **ItemVariation**: Contains `priceMoney.amount` (in smallest currency unit) and `priceMoney.currency`.
- **ProductCard**: The UI representation showing title, category label, price, and image/placeholder.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of category pages render at least one product card when Square has catalog items for that category.
- **SC-002**: Product card price matches Square dashboard within 24 hours of catalog update (caching window).
- **SC-003**: Zero hardcoded/mock product data served on the live site (verified by CI check).
- **SC-004**: Category page returns 404 within 3 seconds when Square API is unreachable.

## Assumptions

- Square sandbox/production has catalog items configured with categories assigned.
- Square items have at least one variation with a price (or price is optional, defaulting to $0.00).
- The Square `searchItems` API with `categoryIds` returns items belonging to those categories.
- The existing `lib/square/catalog.ts` module is the single source for Square product data fetching.
