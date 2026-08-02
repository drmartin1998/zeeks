# Feature Specification: Customer Account Dashboard

**Feature Branch**: `015-customer-account-dashboard`
**Created**: 2026-08-02
**Status**: Draft
**Input**: "As a logged-in customer, I want to view my account dashboard so I can see my reward points, saved information, and order history."

## Clarifications

### Session 2026-08-02

- Q: What should happen if the Square API returns an error for one of the three parallel data fetches (loyalty, profile, orders)? — A: Each section degrades independently. A failed loyalty fetch shows "Points unavailable" in the points card. A failed orders fetch shows "Order history unavailable" in the orders table. A failed profile fetch shows a generic error. Partial success is rendered.
- Q: How should the dashboard behave when a customer has zero loyalty accounts or zero orders? — A: Show empty states specific to each section ("No points yet — start earning with your next purchase", "No orders yet — your order history will appear here").
- Q: What is the visual layout of the dashboard? — A: A responsive CSS grid: points card (top-left), profile info card (top-right), order history table (full-width bottom). On mobile, all stack vertically.
- Q: Should the dashboard fetch data via Server Component or client-side fetch? — A: Server Component with `auth()` and parallel `Promise.allSettled()` for all three Square API calls. No client-side fetch for initial data (Constitution I).
- Q: How does the page handle an unauthenticated user? — A: Clerk middleware already protects the route. If `auth()` returns no userId, redirect to sign-in via `redirectToSignIn()`.

## User Stories

### US1 (P1) — View Loyalty Points Balance

**Why this priority**: The loyalty points balance is the core value proposition of the account dashboard. Customers visiting this page primarily want to check their reward status. This is the motivation to log in.

**Independent Test**: Log in with a test user that has loyalty accounts in Square; verify the points card renders with the correct balance from Square's Loyalty API.

**Acceptance Scenarios**:

1. **Given** a logged-in customer with a Square loyalty account, **When** they visit the account dashboard, **Then** the page displays their current loyalty point balance as a large metric card
2. **Given** a logged-in customer with no loyalty accounts, **When** they visit the account dashboard, **Then** the points section shows "No points yet — start earning with your next purchase"
3. **Given** a logged-in customer and the Square Loyalty API is unreachable, **When** they visit the account dashboard, **Then** the points section shows "Points unavailable" while other sections render normally

---

### US2 (P2) — View Account Profile Information

**Why this priority**: Customers should see their saved profile information to confirm their identity and ensure their details are correct. This is secondary to loyalty points but essential for trust.

**Independent Test**: Log in; verify the profile card shows the customer's given name, family name, and email address fetched from Square's Customers API.

**Acceptance Scenarios**:

1. **Given** a logged-in customer with a Square customer profile, **When** they visit the account dashboard, **Then** the page displays their given name, family name, and email address
2. **Given** a logged-in customer whose Square customer profile fetch fails, **When** they visit the account dashboard, **Then** the profile section shows "Unable to load profile information" while other sections render normally
3. **Given** a logged-in customer with a missing squareCustomerId in their session metadata, **When** they visit the account dashboard, **Then** the page displays a syncing indicator (e.g., "Setting up your account...")

---

### US3 (P3) — View Order History

**Why this priority**: Order history is valuable for repeat customers checking past purchases and order statuses. It is the most data-heavy section and provides the least immediate value compared to points and profile.

**Independent Test**: Log in with a test user that has past orders in Square; verify the orders table renders with order IDs, dates, totals, and statuses sorted by most recent first.

**Acceptance Scenarios**:

1. **Given** a logged-in customer with past orders in Square, **When** they visit the account dashboard, **Then** the page displays a table of past orders with order ID, date, total amount, and status, sorted newest first
2. **Given** a logged-in customer with no past orders, **When** they visit the account dashboard, **Then** the orders section shows "No orders yet — your order history will appear here"
3. **Given** a logged-in customer and the Square Orders API is unreachable, **When** they visit the account dashboard, **Then** the orders section shows "Order history unavailable" while other sections render normally
4. **Given** a logged-in customer with more than 10 past orders, **When** they visit the account dashboard, **Then** only the 10 most recent orders are displayed with a "View all orders" link

---

### Edge Cases

- What happens when `squareCustomerId` is missing from Clerk privateMetadata? The customer was just created in Clerk but hasn't had the webhook fire yet, or the webhook failed. Show "Setting up your account..." syncing state and do not attempt Square API calls.
- What happens when all three Square API calls fail simultaneously? Show a full-page error state with a retry suggestion.
- What happens when loyalty returns multiple loyalty accounts (unlikely but possible)? Display the first active loyalty account's balance; log a warning for investigation.
- What happens when the customer has a very large order history (1000+ orders)? The initial render fetches only the 10 most recent via `limit` parameter; pagination beyond that is out of scope for this feature.
- What happens when a customer's profile has no given name or family name in Square? Show email address only in the profile card; do not render empty fields.

## Functional Requirements

- **FR-001**: Page MUST be a protected Server Component at `app/account/page.tsx` using Clerk `auth()` for session retrieval
- **FR-002**: Page MUST retrieve `squareCustomerId` from the Clerk user's `privateMetadata` via the Clerk Backend API (`getSquareCustomerId` from `lib/webhooks/clerk.ts`)
- **FR-003**: When `squareCustomerId` is missing, the page MUST render a syncing/loading state ("Setting up your account...") and MUST NOT call Square APIs
- **FR-004**: Page MUST perform three parallel data fetches using `Promise.allSettled()`:
  - Customer profile via `CustomersApi.retrieveCustomer(squareCustomerId)`
  - Loyalty balance via `LoyaltyApi.searchLoyaltyAccounts({ query: { customerIds: [squareCustomerId] } })`
  - Order history via `OrdersApi.searchOrders({ query: { filter: { customerFilter: { customerIds: [squareCustomerId] } } }, sort: { sortField: "CLOSED_AT", sortOrder: "DESC" } })` limited to 10 results
- **FR-005**: Each data section MUST degrade independently on failure — a failed loyalty fetch MUST NOT prevent profile or orders from rendering
- **FR-006**: Points card MUST display loyalty point balance from the first active loyalty account as a large numeric metric
- **FR-007**: Profile card MUST display given name, family name, and email address from the Square Customer object
- **FR-008**: Orders table MUST display order ID, closed date, total amount, and fulfillment state for each order, sorted newest first
- **FR-009**: Each section MUST render an appropriate empty state when Square returns no data (not an error)
- **FR-010**: Page MUST use existing shadcn/ui Card, Table, and Badge components for rendering
- **FR-011**: Responsive layout MUST use a CSS grid: 2-column top row (points + profile) and full-width bottom row (orders) on desktop; single-column stacked on mobile
- **FR-012**: Clerk middleware at `middleware.ts` MUST protect the `/account` route, redirecting unauthenticated users to sign-in

## Key Entities

- **Customer Profile**: A Square Customer object with `id`, `givenName`, `familyName`, `emailAddress`, and optional `phoneNumber`. Retrieved via `CustomersApi.retrieveCustomer`.
- **Loyalty Account**: A Square LoyaltyAccount containing `id`, `programId`, `balance` (points), `customerId`, `enrolledAt`, and `lifetimePoints`. Retrieved via `LoyaltyApi.searchLoyaltyAccounts`.
- **Order**: A Square Order containing `id`, `locationId`, `customerId`, `lineItems`, `totalMoney`, `totalTaxMoney`, `totalDiscountMoney`, `state` (OPEN/COMPLETED/CANCELED), `fulfillments`, and `closedAt`. Retrieved via `OrdersApi.searchOrders`.

## Success Criteria

- **SC-001**: Authenticated customers can navigate to `/account` and see their loyalty points within 3 seconds of page load
- **SC-002**: The dashboard renders correctly when any combination of the three Square APIs succeeds or fails (no white screens or crashes)
- **SC-003**: Customers with no loyalty, no orders, or no profile see clear empty states rather than blank sections
- **SC-004**: The responsive layout displays all three sections without horizontal scrolling on viewports from 320px to 1920px
- **SC-005**: Unauthenticated visitors to `/account` are redirected to the sign-in page

## Assumptions

1. Clerk webhook (`user.created` → create/find Square customer → store `squareCustomerId` in `privateMetadata`) has already run for the test user. Spec 008 handles the sync flow.
2. The Square Loyalty program is configured and active. If no loyalty program exists, the loyalty fetch returns an empty result set, which is treated as the "no loyalty" empty state.
3. The Square Orders API returns orders for the customer. If Square's search index has not yet indexed recent orders, they may not appear — this is expected behavior.
4. The Clerk `auth()` helper in `@clerk/nextjs` v7 provides the `userId`. The `squareCustomerId` is retrieved from the Clerk Backend API (`getSquareCustomerId` from `lib/webhooks/clerk.ts`), not from session claims (privateMetadata is not included in JWT session tokens by default).
5. The `middleware.ts` file already configures Clerk middleware. This feature adds `/account` to the protected routes list if not already present.
6. Square API rate limits are sufficient for per-user dashboard loads (not high-traffic pages).
7. The `CustomersApi`, `LoyaltyApi`, and `OrdersApi` are all available in the Square Node.js SDK v45.
8. The dashboard is read-only — no mutations (updating profile, redeeming points) are in scope for this feature.
