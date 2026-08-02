# Feature Specification: Channel-Based Category Filtering

**Feature Branch**: `009-channel-filter`

**Created**: 2026-08-02

**Status**: Draft

**Input**: User description: "only categories that are part of the channel 'CH_zNTh1RdktHh0AQ362Egjt0mUUB5xvj7bpZHdkc049945o' should ever be used on the website."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Categories Restricted to Target Channel (Priority: P1)

As a site administrator, I want only categories assigned to the designated Square sales channel to appear anywhere on the website, so that the storefront reflects the same product catalog visible through Square's online channel.

**Why this priority**: This is the core requirement — without it, categories from other channels (e.g., in-store only) leak onto the website, creating a mismatch between the online storefront and the Square-managed catalog.

**Independent Test**: Fetch categories via the navigation bar and category listing pages. Verify that every displayed category belongs to the specified channel. Verify that categories not in the channel are absent from navigation and category pages.

**Acceptance Scenarios**:

1. **Given** the specified channel ID is configured, **When** the navigation bar fetches categories, **Then** only categories whose `channels` array includes the target channel ID are returned.
2. **Given** a category exists in Square but is NOT assigned to the target channel, **When** a user visits the website, **Then** that category does not appear in the navigation bar, category listing pages, or any product grid.
3. **Given** a category exists in Square AND is assigned to the target channel, **When** a user visits any page on the website, **Then** that category may appear in navigation and category listing pages (subject to the existing allowlist filter).

---

### User Story 2 - Subcategories Inherit Channel Filtering (Priority: P2)

As a site administrator, I want subcategories to automatically respect the channel filter based on their parent category's channel membership, so that I don't need to manually assign channels to every subcategory.

**Why this priority**: Ensures the channel filter applies consistently across the entire category hierarchy without requiring per-subcategory channel assignments.

**Independent Test**: With a parent category in the target channel that has subcategories, verify that those subcategories appear in category dropdowns and product annotations. Verify that subcategories of channel-excluded parents are also excluded.

**Acceptance Scenarios**:

1. **Given** a parent category is assigned to the target channel and has subcategories, **When** the category listing page loads, **Then** those subcategories appear in the Category dropdown filter.
2. **Given** a parent category is NOT assigned to the target channel, **When** the subcategory resolution logic runs, **Then** that parent's subcategories are never returned, regardless of their own channel assignments.

---

### User Story 3 - Channel Configuration is Centralized (Priority: P3)

As a developer, I want the channel filter applied at a single point in the data layer so that all consumers (navigation, category pages, product queries) automatically receive channel-filtered data without each needing its own filter logic.

**Why this priority**: Prevents drift between different consumers and ensures consistent filtering everywhere. Important for maintainability but can be verified after the core filtering works.

**Independent Test**: Add a new page or component that consumes categories. Verify it receives channel-filtered data without any additional filter logic.

**Acceptance Scenarios**:

1. **Given** the channel filter is implemented in the shared category fetch function, **When** any existing or new consumer calls that function, **Then** only channel-filtered categories are returned.
2. **Given** the channel filter is applied centrally, **When** the Square catalog adds a new category assigned to the target channel, **Then** it automatically appears on the website without code changes (assuming it passes the existing allowlist).

---

### Edge Cases

- What happens when the target channel ID is not configured (missing environment variable)? The system should log a warning and return no categories (empty navigation).
- What happens when a category has an empty `channels` array? It should be excluded — an empty channels array means the category belongs to no channel.
- What happens when a category's `channels` field is missing/undefined? It should be treated the same as an empty array — excluded from results.
- What happens when no categories match the channel filter? Navigation should show an empty category list; category pages should return 404; this is acceptable behavior.
- What happens when a previously channel-eligible category is removed from the channel in Square? It should disappear from the website on the next data refresh.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A shared channel ID MUST be configurable via an environment variable (`SQUARE_CHANNEL_ID`), making it easy to change without code modifications.
- **FR-002**: The channel filter MUST be applied in the shared `fetchAllCategories()` function so that every consumer of category data receives channel-filtered results.
- **FR-003**: Categories MUST be filtered by checking if their `categoryData.channels` array contains the configured channel ID. Categories without the channel MUST be excluded.
- **FR-004**: The channel filter MUST be applied BEFORE the existing ALLOWED_CATEGORY_IDS filter in order of operations: channel filter → allowlist filter → isTopLevelCategory filter.
- **FR-005**: Subcategories that pass through the allowlist (via `parentCategory.id` check) MUST also be checked against the channel filter — only subcategories of channel-eligible parents should pass through.
- **FR-006**: The system MUST log a warning (not throw an error) if the channel environment variable is missing or empty, and gracefully return no categories.
- **FR-007**: Product queries MUST only search within channel-eligible categories, ensuring products from excluded categories are not returned.
- **FR-008**: The navigation bar, category listing pages, and any future category consumers MUST all automatically receive channel-filtered data without requiring individual filter logic.

### Key Entities

- **Square Channel**: A Square-defined grouping that controls where catalog objects are visible. Represented by an ID string (e.g., `CH_zNTh1RdktHh0AQ362Egjt0mUUB5xvj7bpZHdkc049945o`). Each category object contains a `channels` array listing which channels it belongs to.
- **Square Catalog Category**: Already defined in the system. The `categoryData.channels` field (array of channel ID strings) is the key attribute used for filtering. This field already exists on all Square category objects in the API response.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of categories displayed on any website page belong to the configured target channel.
- **SC-002**: Adding or removing a category from the target channel in Square is reflected on the website within one page load or data refresh cycle. **Validation**: Existing 1-hour ISR revalidation ensures Square-side changes propagate within the next page load after the revalidation window. No additional task required — ISR behavior is unchanged by the channel filter.
- **SC-003**: Zero categories from non-target channels leak into navigation, category pages, or product grids.
- **SC-004**: All existing functionality (navigation, category pages, subcategory dropdowns, product display) continues to work correctly with the channel filter applied.

## Assumptions

- The target channel ID (`CH_zNTh1RdktHh0AQ362Egjt0mUUB5xvj7bpZHdkc049945o`) is a valid, active Square sales channel.
- The `channels` field on Square category objects is always populated by the Square API response (it may be an empty array).
- The channel ID is stored as an environment variable (`SQUARE_CHANNEL_ID`) and is available server-side only.
- The existing `ALLOWED_CATEGORY_IDS` filter remains in place and operates as a secondary filter after the channel filter.
- The subcategory resolution logic (checking `parentCategory.id`) continues to work correctly with the channel filter applied — subcategories of excluded parents are implicitly excluded.
- Only one channel needs to be supported at this time. Multi-channel support is out of scope for v1.
