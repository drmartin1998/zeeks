# Feature Specification: Allowlisted Category Filtering (Miniatures + Hobby Supplies)

**Feature Branch**: `005-miniatures-only-category`

**Created**: 2026-08-01

**Updated**: 2026-08-01

**Status**: Draft

**Input**: User description: "with the only top level categories we want to use are Miniatures (ZCZJWQX6WREDLATZFW3U7OCJ) and Hobby Supplies (62G7JSXJDS4U574NW4XS4WKV). Filter all other top level categories out."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Only Allowlisted Categories in Navigation (Priority: P1)

As a customer browsing the Zeeks online store, I want the navigation bar to show only the Miniatures and Hobby Supplies categories (and their subcategories) among the Square-powered category links, so I'm not distracted by categories that have no products.

**Why this priority**: The navigation bar is the primary discovery mechanism. Showing categories with no products (or categories that aren't yet stocked) creates a broken user experience and erodes trust.

**Independent Test**: Deploy the change and verify that the nav bar displays only "Miniatures" and "Hobby Supplies" from the Square catalog, alongside the static links (About Us, Locations, Sale). Any other Square top-level categories like "Board Games" or "Card Games" must not appear.

**Acceptance Scenarios**:

1. **Given** the Square catalog contains top-level categories "Miniatures" (ID ZCZJWQX6WREDLATZFW3U7OCJ), "Hobby Supplies" (ID 62G7JSXJDS4U574NW4XS4WKV), and "Board Games", **When** any page loads with the navigation bar, **Then** only "Miniatures" and "Hobby Supplies" appear as Square-powered nav categories alongside the static links (About Us, Locations, Sale).
2. **Given** the Square catalog contains only "Miniatures" and "Hobby Supplies" as top-level categories, **When** any page loads, **Then** the nav bar shows both categories + static links with no degradation.
3. **Given** both Miniatures and Hobby Supplies categories are temporarily unavailable or the Square API returns an error, **When** any page loads, **Then** only the static nav links (About Us, Locations, Sale) are displayed — no error is shown to the user.

---

### User Story 2 - Category Pages Only for Allowlisted Categories (Priority: P2)

As a customer, when I navigate to `/categories/miniatures` or `/categories/hobby-supplies`, I expect to see the respective product listing pages. If I try to access another category like `/categories/board-games`, I should receive a clear indication that the category is not available.

**Why this priority**: Ensuring clean category URLs prevents confusion from landing pages that would be empty or incorrect for non-allowlisted categories.

**Independent Test**: Visit `/categories/miniatures` and `/categories/hobby-supplies` — products load. Visit `/categories/board-games` or any other non-allowlisted category — a 404 page or appropriate "category not found" message is displayed.

**Acceptance Scenarios**:

1. **Given** the Miniatures category exists in Square, **When** a user visits `/categories/miniatures`, **Then** the Miniatures product listing page renders with its products and subcategories.
2. **Given** the Hobby Supplies category exists in Square, **When** a user visits `/categories/hobby-supplies`, **Then** the Hobby Supplies product listing page renders with its products and subcategories.
3. **Given** a non-allowlisted top-level category (e.g., "Board Games") exists in Square but is excluded by the filter, **When** a user visits `/categories/board-games`, **Then** a 404 page or "category not found" message is displayed.
4. **Given** the Miniatures category has subcategories (e.g., "Warhammer 40K"), **When** a user visits `/categories/miniatures`, **Then** subcategory filter chips are displayed for those subcategories.

---

### User Story 3 - API Returns Only Allowlisted Categories (Priority: P3)

As a developer integrating with the front-end, I want the categories API endpoint to return only the Miniatures and Hobby Supplies top-level categories so that any client-side consumer (not just the nav bar) also respects this filtering.

**Why this priority**: Centralizing the filter at the data layer ensures consistency across all consumers (nav bar, category pages, sitemap, etc.) without requiring each consumer to implement its own filter.

**Independent Test**: Call `GET /api/catalog/categories` and verify the response contains only Miniatures and Hobby Supplies (plus any of their subcategories are excluded per existing top-level-only logic), with no other top-level categories present.

**Acceptance Scenarios**:

1. **Given** the Square catalog contains multiple top-level categories, **When** the categories API endpoint is called, **Then** only the Miniatures category (ZCZJWQX6WREDLATZFW3U7OCJ) and Hobby Supplies category (62G7JSXJDS4U574NW4XS4WKV) are returned as top-level categories.
2. **Given** the Miniatures and Hobby Supplies categories have subcategories, **When** the categories API endpoint is called, **Then** subcategories are excluded from the response (existing top-level-only behavior is preserved).

### Edge Cases

- What happens when a category ID changes in Square? A hardcoded ID must be updated in the codebase if it changes.
- What happens when an allowlisted category is deleted from Square? The system should gracefully fall back to showing only the remaining allowlisted categories (or only static nav links if all are deleted).
- What happens when new top-level categories are added to Square? They must be automatically excluded unless explicitly added to the allowlist.
- What about the `/shop/[category]` route? It should also respect the same category filtering.
- What about the subcategory filtering feature (spec `subcategory-filtering`)? It should continue to work correctly for allowlisted categories' subcategories.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST filter Square catalog categories to only include top-level categories with IDs `ZCZJWQX6WREDLATZFW3U7OCJ` (Miniatures) and `62G7JSXJDS4U574NW4XS4WKV` (Hobby Supplies) wherever top-level categories are fetched and displayed.
- **FR-002**: System MUST apply this filter in the category-fetching data layer (`lib/square/catalog.ts`) so all consumers (nav bar, API routes, category pages) receive only the allowlisted categories.
- **FR-003**: System MUST preserve existing static navigation links (About Us, Locations, Sale) — these are unaffected by Square category filtering.
- **FR-004**: System MUST handle the case where an allowlisted category is not found in the Square API response (return only the categories that are present, not an error).
- **FR-005**: System MUST return a 404 response for category page requests targeting non-allowlisted categories.
- **FR-006**: System MUST preserve existing subcategory filtering behavior for allowlisted categories' subcategories.
- **FR-007**: The `GET /api/catalog/categories` endpoint MUST return only the Miniatures and Hobby Supplies categories as top-level categories.

### Key Entities *(include if feature involves data)*

- **SquareCatalogCategory**: An object from the Square Catalog API representing a category. Key attributes: `id`, `categoryData.name`, `categoryData.parentCategoryId`. The filter operates on the `id` field, matching against the allowlisted category IDs (`ZCZJWQX6WREDLATZFW3U7OCJ` for Miniatures and `62G7JSXJDS4U574NW4XS4WKV` for Hobby Supplies).
- **NavCategory**: Internal representation used by the navigation bar. Derived from `SquareCatalogCategory` via `mapSquareCategoryToNavCategory()`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The navigation bar displays exactly two Square-powered categories (Miniatures and Hobby Supplies) alongside the three static links (About Us, Locations, Sale) — verified by visual inspection and automated tests.
- **SC-002**: Visiting `/categories/board-games` or any other non-allowlisted category URL returns a 404 within 1 second.
- **SC-003**: The `GET /api/catalog/categories` endpoint returns at most 2 top-level categories (Miniatures and Hobby Supplies) in its JSON response.
- **SC-004**: All existing tests (unit, integration, E2E) pass after the filter is applied — no regressions to subcategory filtering, pagination, or product display.
- **SC-005**: Zero mock data is used in production code — the filter operates on live Square API data only.

## Assumptions

- The Miniatures category ID (`ZCZJWQX6WREDLATZFW3U7OCJ`) and Hobby Supplies category ID (`62G7JSXJDS4U574NW4XS4WKV`) are stable and will not change in the Square catalog. If an ID changes, the code must be updated.
- Both Miniatures and Hobby Supplies categories exist in the Square production catalog and have products assigned to them.
- Other top-level categories may still exist in Square but will simply be filtered out at the application level.
- The existing `isTopLevelCategory()` utility and subcategory filtering logic remain unchanged and continue to work for allowlisted categories' subcategories.
- The static navigation links (About Us, Locations, Sale) are not affected by this change and continue to appear in the nav bar.
- This is a production-only change; no sandbox fallback is needed since the app now runs exclusively against Square production (per prior configuration change).
