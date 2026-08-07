# Feature Specification: Shop Menu Drilldown

**Feature Branch**: `036-shop-menu-drilldown`

**Created**: 2026-08-07

**Status**: Draft

**Input**: User description: "There is a new shop-menu-drilldown and shop-menu-drilldown mobile menu design in the Figma. These megamenus show when a user clicks or taps on a global nav menu named 'Shop'. They contain top level categories with 2 levels of subcategories below them. Pay attention to have child categories and selected categories work under the Miniatures category in the nav specifically to understand how these are designed."

## Clarifications

### Session 2026-08-07

- Q: When "Shop" is added, should the existing top-level category links be removed from the main nav row and consolidated under "Shop", or remain alongside it? → A: Replace the flat catalog links with a single "Shop" menu; the catalog lives only in the megamenu/drawer.
- Q: On desktop, how should the two levels of subcategories be displayed within a category column in the megamenu? → A: Show both levels statically in the column, with level-2 children indented under their parent subcategory.
- Q: What interaction should open the desktop megamenu? → A: Open on hover and close on leaving the menu area; click/tap also toggles for touch and keyboard users.
- Q: How should a subcategory's destination page be addressed in the URL? → A: Use the existing query-parameter pattern on the category page (`/categories/[slug]?sub=<sub>`).
- Q: Should the Shop menu be closed by default on page load, or reflect the current category on category pages? → A: Closed by default; the current category is highlighted only while the menu is open.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Shop Megamenu on Desktop (Priority: P1)

A visitor browsing on a desktop browser sees a "Shop" item in the global navigation as the single entry point to the product catalog. When the visitor hovers over or clicks "Shop", a large dropdown panel — a megamenu — slides open beneath the nav. The megamenu shows top-level product categories as columns (e.g., TCGs, Comics & Manga, Board Games, RPGs, Miniatures). Each column lists its subcategories beneath the column heading, and each column offers a "Shop All" link to view everything in that category. The panel is full-width, has a light backdrop behind it to focus attention, and closes when the pointer leaves the menu area or the visitor clicks elsewhere.

**Why this priority**: The desktop megamenu is the primary way most shoppers discover and navigate to the store's product range. It is the clearest, highest-traffic surface for exposing the full catalog hierarchy and is visible on every page. Delivering it first provides immediate value without any dependency on the mobile behavior.

**Independent Test**: Can be fully tested by rendering the global nav on a desktop viewport, activating the "Shop" item, and verifying the megamenu panel appears with top-level category columns, their subcategory links, and "Shop All" links, and that the panel opens/closes correctly.

**Acceptance Scenarios**:

1. **Given** a desktop viewport with the global nav visible, **When** the visitor activates the "Shop" menu item, **Then** a megamenu panel opens beneath the nav showing top-level categories as columns with their subcategories listed under each heading.
2. **Given** the megamenu is open, **When** the visitor moves the pointer away from both the "Shop" item and the panel, **Then** the megamenu closes and the page returns to its normal state.
3. **Given** the megamenu is open, **When** the visitor clicks a subcategory link, **Then** they are taken to the corresponding category page and the megamenu closes.
4. **Given** the megamenu is open, **When** the visitor clicks a "Shop All" link for a column, **Then** they are taken to that top-level category's page and the megamenu closes.

---

### User Story 2 - Shop Drilldown Menu on Mobile (Priority: P2)

A visitor on a phone or narrow screen sees the global nav with a "Shop" item. Tapping "Shop" opens a full-screen mobile menu drawer that shows the top-level categories as a list. Tapping a category that has subcategories advances to a second panel showing that category's subcategories, with a back control to return to the top-level list. Tapping a subcategory that has further children advances to a third panel listing those leaf subcategories. Tapping a category with no children navigates directly to that category's page. The current position is always visible so the visitor knows where they are in the hierarchy.

**Why this priority**: Mobile shoppers need the same catalog access as desktop users. The drilldown is a direct translation of the desktop megamenu hierarchy into a touch-friendly, step-by-step flow. It is high value but is secondary to the desktop experience that most conversions happen on.

**Independent Test**: Can be fully tested by rendering the nav on a mobile viewport, tapping "Shop", then tapping through categories with subcategories to verify the drilldown advances one level at a time, the back control returns to the previous level, and leaf categories navigate directly to their pages.

**Acceptance Scenarios**:

1. **Given** a mobile viewport with the global nav visible, **When** the visitor taps "Shop", **Then** a full-screen menu drawer opens showing the top-level categories as a selectable list.
2. **Given** the top-level category list is showing, **When** the visitor taps a category that has subcategories, **Then** the drawer advances to a second panel showing that category's subcategories with a back control to return to the top-level list.
3. **Given** a subcategory panel is showing, **When** the visitor taps a subcategory that has further children, **Then** the drawer advances to a third panel listing those leaf subcategories.
4. **Given** any category panel is showing, **When** the visitor taps a category that has no children, **Then** they are navigated to that category's page and the drawer closes.
5. **Given** a sub-panel is showing, **When** the visitor taps the back control, **Then** the drawer returns to the previous level of the hierarchy.

---

### User Story 3 - Miniatures Category with Deep Nesting (Priority: P2)

The "Miniatures" category contains subcategories and, within those, a second level of subcategories (e.g., a brand line such as "Games Workshop" containing ranges). When the visitor is browsing the Miniatures column on desktop, they see its subcategories and, where they exist, the nested child ranges indented under their parent subcategory. On mobile, drilling into a Miniatures subcategory that has its own children shows the third-level leaf list. Selecting a category keeps the hierarchy visible so the visitor always understands which parent category they are within.

**Why this priority**: Miniatures is the deepest and most complex category in the catalog. Confirming the drilldown handles two levels of nesting under this specific category ensures the design scales for the hardest case. It is a validation of the pattern rather than a standalone deliverable, so it is P2.

**Independent Test**: Can be fully tested by populating the nav with a Miniatures category that has two levels of subcategories, then verifying on desktop that nested children render under their parent subcategory, and on mobile that drilling reaches the third level and back-navigation works.

**Acceptance Scenarios**:

1. **Given** the Miniatures category has subcategories and some subcategories have their own children, **When** the visitor views the Miniatures megamenu column on desktop, **Then** the top-level subcategories are shown and nested child ranges are grouped under their parent subcategory.
2. **Given** a category with nested children, **When** the visitor navigates to it, **Then** the selected parent category remains visible in the header so the visitor knows where they are in the hierarchy.
3. **Given** the Miniatures category on mobile, **When** the visitor drills down through a subcategory to its children, **Then** the third-level leaf list is shown and the back control returns to the subcategory level.

---

### Edge Cases

- What happens when a top-level category has no subcategories? It should appear as a direct navigable link without a drilldown/expand affordance.
- What happens when a category's subcategory list is longer than the visible panel? The list should scroll so all items remain reachable.
- What happens when the Shop menu is open and the visitor resizes the viewport across the desktop/mobile breakpoint? The menu should adapt to the new layout without leaving a stale state.
- How does the menu behave when catalog data is unavailable? The Shop menu should show a graceful empty/error state rather than fabricating categories.
- What happens when only one category has deep nesting while others are shallow? Each category should render at its own depth; shallow categories should not force an empty third level.
- How does the drilldown handle a category with a very long name? Text should truncate or wrap cleanly without breaking the row layout.
- What happens when the visitor activates "Shop" while another menu interaction is in progress? The newest interaction should take precedence and the menu state should remain consistent.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The global navigation MUST include a "Shop" menu item as the single entry point to the product catalog, replacing the previous flat top-level category links, and indicating it opens a menu.
- **FR-002**: On desktop, the megamenu MUST open on hover over "Shop" and close when the visitor leaves the menu area; click/tap MUST also toggle it open and closed for touch and keyboard users. The open panel MUST be full-width and show top-level categories as columns, each with a heading, its subcategory links, and a "Shop All" link.
- **FR-003**: The megamenu panel MUST support top-level categories with up to two levels of subcategories, rendering level-2 children statically indented under their parent subcategory.
- **FR-004**: The megamenu panel MUST close when the visitor moves input away from the "Shop" item and the panel, or clicks elsewhere.
- **FR-005**: On mobile, tapping "Shop" MUST open a full-screen menu drawer listing top-level categories.
- **FR-006**: On mobile, selecting a category with subcategories MUST advance the drawer to a second panel showing those subcategories.
- **FR-007**: On mobile, selecting a subcategory with further children MUST advance the drawer to a third panel listing those leaf subcategories.
- **FR-008**: On mobile, each sub-panel MUST provide a back control that returns to the previous level of the hierarchy.
- **FR-009**: Selecting a category that has no children MUST navigate directly to that category's page and close the menu.
- **FR-010**: The Shop menu MUST be closed by default on page load. When a category is selected and has children, the selected parent category MUST remain visible in the panel header so the visitor knows their current position in the hierarchy; the current category is highlighted only while the menu is open.
- **FR-011**: The menu MUST only display categories sourced from the live product catalog; on data failure it MUST show a graceful error state and never substitute fabricated categories.
- **FR-012**: Categories with no subcategories MUST render as direct navigable links without an expand affordance.

### Key Entities *(include if feature involves data)*

- **Category Tree**: A hierarchical representation of the product catalog where each category can have zero, one, or two levels of child categories beneath it. Each node has a display name and a destination page (`/categories/[slug]?sub=<sub>` for subcategories), and a token indicating whether it has children. This extends the existing flat category model to support nesting.
- **Menu Panel**: The visible container (full-width megamenu on desktop, full-screen drawer on mobile) that renders a level of the category tree at a time.
- **Drilldown State**: The current position within the category hierarchy (which category is selected at each level), which drives what the panel shows and what the back control returns to.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can open the Shop menu and reach any product category in the catalog within 2 interactions (open menu, select category).
- **SC-002**: On desktop, the megamenu opens and becomes interactive within 200ms of the visitor activating "Shop".
- **SC-003**: On mobile, drilling from the top-level list down to a leaf category takes no more than 3 taps.
- **SC-004**: 100% of top-level categories and their subcategories are reachable from the Shop menu without visiting a search engine or the category page directly.
- **SC-005**: The drilldown correctly handles the Miniatures category's two-level nesting, with no category or child range unreachable.

## Assumptions

- The product catalog is managed in the existing commerce backend and exposes a hierarchy of categories with up to two levels of nesting.
- The "Shop" menu item is the single entry point to the product catalog hierarchy; the previous flat top-level category links are removed from the main nav row and consolidated under "Shop".
- Desktop and mobile use different physical layouts (full-width panel vs. full-screen drawer) but share the same underlying category hierarchy and drilldown state.
- The categories shown (e.g., TCGs, Comics & Manga, Board Games, RPGs, Miniatures) are illustrative of the catalog structure and are sourced from live data, not hardcoded.
- A category with no children is a direct link; only categories with children gain an expand/drilldown affordance.
- The existing global navigation, category pages, and Square-managed category data will be reused; no new content authoring system is introduced.