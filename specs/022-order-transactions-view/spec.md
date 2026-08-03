# Feature Specification: Paginated Order History

**Feature Branch**: `022-order-transactions-view`
**Created**: 2026-08-03
**Status**: Implemented
**Input**: "As a user I want to see all of my transactions and orders from the profile page."
**Scope Note**: Transaction history was removed during implementation. This feature delivers cursor-based pagination for orders only.

## User Scenarios & Testing

### User Story 1 - View All Orders with Pagination (Priority: P1)

A logged-in customer visits their account page and sees their complete order history — not just the last 10 — with the ability to load more orders on demand.

**Why this priority**: The current 10-order limit is insufficient for repeat customers. Expanding to show all orders is the core value of this feature.

**Independent Test**: Log in with a customer who has 15+ orders in Square; verify the initial 10 load, then click "Load More" and see the next batch appear without replacing the first 10.

**Acceptance Scenarios**:

1. **Given** a logged-in customer with more than 10 orders, **When** they visit the account page, **Then** the 10 most recent orders are displayed with a "Load More" button below them
2. **Given** a logged-in customer viewing their orders, **When** they click "Load More", **Then** the next 10 orders are appended to the existing list and the button is shown again if more orders remain
3. **Given** a logged-in customer has loaded all available orders, **When** no more orders remain, **Then** the "Load More" button is hidden and a "Showing all N orders" indicator is displayed
4. **Given** a logged-in customer with no past orders, **When** they visit the account page, **Then** the empty state message is displayed and no "Load More" button is shown

---

### Edge Cases

- **Customer with 0 orders**: Show empty state "No orders yet — your order history will appear here". No "Load More".
- **Orders API returns exactly 10 results (ambiguous page boundary)**: The "Load More" button is shown; clicking it fires the next fetch; if it returns 0 results the button is removed.
- **Rapid "Load More" clicks**: Button is disabled during loading to prevent duplicate fetches.

## Requirements

### Functional Requirements

- **FR-001**: Orders section MUST fetch and display orders with cursor-based pagination (10 per page)
- **FR-002**: "Load More" button MUST be shown when more orders exist and MUST fetch the next page using the Square cursor
- **FR-003**: "Load More" button MUST show a loading state ("Loading...") and be disabled while fetching
- **FR-004**: When all orders are loaded, a "Showing all N orders" indicator MUST replace the "Load More" button
- **FR-005**: The orders section empty state MUST read "No orders yet — your order history will appear here"

### Key Entities

- **Order** (existing): Square Order with `id`, `closedAt`, `totalMoney` (amount + currency), `state` (OPEN/COMPLETED/CANCELED). Fetched via `OrdersApi.searchOrders` with `customerFilter` and cursor.

## Success Criteria

- **SC-001**: Customers with 100+ orders can paginate through all of them without performance degradation
- **SC-002**: Customers with 0 orders see a clear empty state
- **SC-003**: The "Load More" button is responsive and shows appropriate loading state

## Assumptions

1. Cursor-based pagination is used for orders (Square SearchOrders returns a `cursor` for next page)
2. The existing `OrdersCard` component is modified to support pagination
3. "Load More" is implemented via a Server Action that calls Square directly
