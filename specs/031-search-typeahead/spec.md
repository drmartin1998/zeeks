# Feature Specification: Search Typeahead

**Feature Branch**: `031-search-typeahead`

**Created**: 2026-08-07

**Status**: Draft

**Input**: User description: "In Figma there is a new search-typeahead component that is an update to the search component."

## Clarifications

### Session 2026-08-07

- Q: Should the product suggestions be fetched from the catalog on each keystroke, or should the app filter an already-loaded product list on the shopper's device? → A: Fetch from the catalog with a server-side search on each pause in typing (debounced), so suggestions reflect the freshest catalog data.
- Q: How many product suggestions should the dropdown show before the "View all results" option? → A: Show up to 5 suggestions, matching the Figma product-row layout.
- Q: Should the typeahead appear only in the site-navigation search bar, or also on the search results page? → A: Replace only the navigation search bar; the search results page is out of scope for the typeahead.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See product suggestions while typing (Priority: P1)

A shopper begins typing in the search bar and immediately sees a dropdown panel of matching product suggestions beneath the input. As they continue typing, the suggestions update to reflect the current text. This lets them spot and jump to a product without submitting a full search.

**Why this priority**: This is the core value of the typeahead — transforming search from a submit-and-wait flow into an instant, guided discovery experience. It directly replaces the current plain search-bar behavior.

**Independent Test**: Can be fully tested by focusing the search input, typing a partial keyword (e.g., "war"), and confirming a dropdown of matching product suggestions appears and updates with each keystroke.

**Acceptance Scenarios**:

1. **Given** a shopper focuses the search input, **When** they type a keyword, **Then** a dropdown panel appears showing matching product suggestions.
2. **Given** a shopper has typed a partial keyword, **When** they continue typing, **Then** the suggestions update to reflect the full text.
3. **Given** the search input shows a query, **When** the shopper clicks a suggested product, **Then** they navigate to that product's detail page.

---

### User Story 2 - See a results count and view all results (Priority: P1)

The typeahead dropdown shows how many total results match the query and provides a "View all results" option so the shopper can jump to the full search results page.

**Why this priority**: The results count communicates scope at a glance, and the "view all" affordance preserves access to the complete results experience. Both are core to the typeahead design.

**Independent Test**: Can be fully tested by typing a keyword with multiple matches and confirming the dropdown shows the result count and a working "View all results" link that opens the search results page.

**Acceptance Scenarios**:

1. **Given** a shopper has typed a query with matching products, **When** the dropdown renders, **Then** it displays the number of matching results.
2. **Given** the dropdown shows suggestions, **When** the shopper selects "View all results", **Then** they are taken to the full search results page for their query.

---

### User Story 3 - Clear the search and see an empty state (Priority: P2)

A shopper can clear the current query with a visible control in the input. When a query produces no matching products, the dropdown shows a friendly empty state with suggestions for alternative searches.

**Why this priority**: Clearing the query is an essential input interaction, and the empty state gracefully handles searches that return nothing. Both are secondary to the core suggestion flow.

**Independent Test**: Can be fully tested by typing a query, using the clear control to empty the input (dropdown closes), and typing a nonsense query to confirm the empty-state message appears.

**Acceptance Scenarios**:

1. **Given** a shopper has typed a query, **When** they use the clear control, **Then** the input is emptied and the suggestion dropdown closes.
2. **Given** a shopper types a query with no matching products, **When** the dropdown renders, **Then** it shows a "no products found" message with the query and example alternative searches.

---

### User Story 4 - Typeahead works in the navigation search bar (Priority: P1)

The typeahead replaces the current search bar in the site navigation so it is available on every page and consistent across the store.

**Why this priority**: The navigation search bar is the primary entry point for search on all pages; updating it delivers the typeahead experience everywhere.

**Independent Test**: Can be fully tested by navigating to any page and confirming the navigation search bar shows typeahead suggestions while typing.

**Acceptance Scenarios**:

1. **Given** a shopper is on any page, **When** they type in the navigation search bar, **Then** a typeahead dropdown of suggestions appears.
2. **Given** a shopper submits a query via the search bar, **When** they press Enter or the search button, **Then** they are taken to the search results page as before.

---

### Edge Cases

- What happens when the shopper clears the input? The dropdown closes and the input returns to its default state.
- What happens when a query matches only one product? The dropdown shows that single suggestion with a count of one.
- What happens when the shopper clicks outside the dropdown? The dropdown should close.
- What happens when the shopper presses the Escape key? The dropdown should close.
- What happens when the search backend is slow or fails? The dropdown should show a loading indicator while awaiting results; on failure it should not break the page, showing an appropriate state or allowing the standard submit flow.
- What happens when the shopper navigates with keyboard arrows? The suggestions should be navigable by keyboard (arrow up/down + Enter to select).
- What happens when the query is only whitespace? No suggestions should be shown.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The search input MUST fetch matching product suggestions from the catalog via a server-side search on each pause in typing (debounced request after the shopper stops typing), updating the dropdown as new suggestions arrive.
- **FR-002**: Each suggestion MUST be a product from the catalog matching the current query, and selecting a suggestion MUST navigate to that product's detail page.
- **FR-003**: The dropdown MUST display the total number of matching results for the current query.
- **FR-004**: The dropdown MUST provide a "View all results" action that navigates to the full search results page for the current query.
- **FR-005**: The search input MUST provide a clear control that empties the query and closes the dropdown.
- **FR-006**: When a query yields no matching products, the dropdown MUST display an empty-state message with the query and example alternative searches.
- **FR-007**: The typeahead MUST replace the existing search bar in the site navigation (the only integration point) so it is available on all pages; other search inputs and the search results page are out of scope.
- **FR-008**: Submitting a query via Enter or the search button MUST continue to navigate to the search results page.
- **FR-009**: The dropdown MUST close when the shopper clicks outside it, presses Escape, or clears the input.
- **FR-010**: The suggestions MUST be navigable by keyboard (arrow keys to move, Enter to select) and accessible to screen readers.
- **FR-011**: A whitespace-only query MUST NOT trigger suggestions.

### Key Entities *(include if feature involves data)*

- **Suggestion**: A single product suggestion shown in the dropdown, comprising the product's name, category, price, and a link to its detail page.
- **Query**: The current text in the search input; drives which suggestions appear.
- **Typeahead Dropdown**: The panel shown beneath the input containing the results header, suggestion list, and "View all results" footer (or the empty state).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Suggestions appear within 300ms of the shopper pausing while typing.
- **SC-002**: The suggestion list matches the current query, verifiable by comparing displayed suggestions to known matching catalog products.
- **SC-003**: A shopper can select a suggestion and reach the product detail page with a single action.
- **SC-004**: The clear control empties the query and closes the dropdown in a single action.
- **SC-005**: The typeahead renders consistently on all pages via the navigation search bar with no visual overflow or layout shift.

## Assumptions

- The typeahead replaces the existing navigation search bar interaction; the underlying search results page (`/search?q=`) remains unchanged.
- Product suggestions are matched against the catalog by product name/description, consistent with the existing search behavior.
- The suggestion dropdown shows up to 5 of the top matching products, while "View all results" shows the complete set on the search results page.
- The typeahead is a client-side enhancement layered on the existing search bar, which continues to work without JavaScript (progressive enhancement).
- The two design states in the component set correspond to: (a) results available, and (b) no results (empty state).