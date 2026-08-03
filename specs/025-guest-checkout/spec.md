# Feature Specification: Guest Cart & Checkout

**Feature Branch**: `025-guest-checkout`

**Created**: 2026-08-03

**Status**: Draft

**Input**: User description: "as a guest user I should be able to add items to a cart and checkout completely."

## Clarifications

### Session 2026-08-03

- Q: Should guest users be asked to provide an email address before checkout, so Square can send an order receipt? → A: Square handles email collection on its hosted payment page; no email collection required on the store side for guests.
- Q: When exactly should the guest cart be cleared on checkout — after the payment link is created or after the guest completes/cancels payment on Square's page? → A: Clear after payment link creation, before redirect to Square. The cart order is consumed once the payment link exists; line items are locked at that point.
- Q: Should the guest cart cookie include integrity protection to prevent tampering? → A: Accept the risk for MVP — Square order IDs are non-sequential, cart data is low-sensitivity, no PII is exposed.
- Q: When a guest opens the store in two tabs and modifies the cart in both, what should happen? → A: Last write wins via eventual consistency — each operation reads the latest Square order state, applies changes, and writes back. The most recent write is authoritative.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Adds Items to Cart (Priority: P1)

An unauthenticated visitor browses the store, selects products, and adds them to a cart. The cart persists across page navigations and browser refreshes without requiring sign-in. The guest sees their cart with line items, quantities, and a subtotal, and can adjust quantities or remove items — exactly the same cart experience as an authenticated customer.

**Why this priority**: Without a cart, guests cannot accumulate items to purchase. This is the entry point for the entire guest checkout journey. No guest will checkout if they cannot first build a cart.

**Independent Test**: As an unauthenticated visitor, browse products, add two different items to the cart, navigate to the cart page, verify both items appear with correct quantities and subtotal. Refresh the page and verify the cart is still intact.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor on a product page, **When** they click "Add to Cart", **Then** the item is added to a guest cart with the selected quantity, and a visual confirmation (e.g., cart count update) is shown
2. **Given** an unauthenticated visitor with items in their guest cart, **When** they navigate to the cart page (`/cart`), **Then** they see all added line items with product names, quantities, individual prices, and a subtotal — identical layout to the authenticated cart
3. **Given** an unauthenticated visitor with items in their guest cart, **When** they close the browser tab and reopen the store, **Then** their cart items are still present (cart persists within the same browser session)
4. **Given** an unauthenticated visitor with items in their guest cart, **When** they adjust the quantity of an item or remove an item, **Then** the cart updates immediately and reflects the new state

---

### User Story 2 - Guest Completes Checkout (Priority: P1)

An unauthenticated visitor with items in their guest cart clicks "Proceed to Checkout." The system creates a Square order from the guest cart items, generates a Square payment link, and redirects the guest to the Square-hosted payment page. No sign-in or account creation is required. After payment, the guest returns to the order confirmation page.

**Why this priority**: The entire guest checkout flow. Without this, guests can add to cart but cannot complete a purchase — the primary business goal is lost.

**Independent Test**: Add items as a guest, click "Proceed to Checkout" from the cart page, and verify redirection to a Square-hosted payment page. Complete a test payment on Square and verify return to the order confirmation page.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor with a non-empty guest cart, **When** they click "Proceed to Checkout" on the cart page, **Then** a Square order is created from the cart items, a payment link is generated, and the visitor is redirected to the Square-hosted payment page
2. **Given** an unauthenticated visitor redirected to the Square payment page, **When** they complete payment, **Then** they are returned to `/order/result?status=COMPLETED&transactionId=...` showing the order confirmation with transaction ID and purchased items
3. **Given** an unauthenticated visitor with a guest cart containing an unavailable (out-of-stock or delisted) item, **When** they view the cart page, **Then** the "Proceed to Checkout" button is disabled with an explanatory message

---

### User Story 3 - Guest Cart Survives Sign-In (Priority: P2)

When an unauthenticated visitor has built a guest cart and subsequently signs in (or creates an account), their guest cart items are preserved so they do not lose their selections. The guest cart content is transferred to their authenticated cart.

**Why this priority**: Prevents cart abandonment when guests decide to sign in mid-shopping. Losing cart items on sign-in would be frustrating and lose sales.

**Independent Test**: Add items as a guest, navigate to sign-in, complete sign-in, verify the cart still contains the same items with the same quantities.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor with a guest cart containing items, **When** they sign in via Clerk, **Then** their guest cart items are transferred to their authenticated cart (Square draft order), and the guest cart is cleared
2. **Given** an authenticated customer with an existing cart, **When** they had guest cart items from before signing in, **Then** the guest cart items are merged into their existing authenticated cart (combined line items, with duplicate items having their quantities summed)

---

### User Story 4 - Guest Cart Expiry & Clearance (Priority: P3)

Guest carts that are abandoned or unused for an extended period are automatically cleaned up. Guests can also manually clear their cart.

**Why this priority**: Prevents stale data accumulation and keeps the guest experience clean. Important for data hygiene but not blocking the purchase flow.

**Independent Test**: Create a guest cart, wait for the expiry period, refresh the page, and verify the cart is empty. Also verify manual "Clear Cart" works immediately.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor with a guest cart, **When** the guest cart has not been modified for a defined expiry period, **Then** on next page visit the cart is empty and the visitor starts fresh
2. **Given** an unauthenticated visitor with a guest cart, **When** they click a "Clear Cart" option, **Then** all items are removed immediately and the cart shows an empty state

---

### Edge Cases

- **Guest completes checkout, then signs in**: The completed guest order is not automatically linked to the newly authenticated account. The order is accessible via the transaction ID on the result page. The authenticated cart starts empty (fresh state).
- **Guest clears browser cookies/storage**: If the guest cart is stored in browser storage (cookies) and the visitor clears them, the cart is lost. This is expected behavior for a guest — the store shows an empty cart state.
- **Guest cart with expired/unavailable products**: If a guest returns to their cart and a previously added item has since been delisted or gone out of stock, the item is flagged as unavailable. The checkout button is disabled and a message is shown, same as the authenticated flow.
- **Simultaneous guest and authenticated carts**: If a visitor starts as a guest (adds to guest cart), signs in (guest cart transfers to authenticated), then signs out and browses again as a guest, a NEW empty guest cart is created — the previous guest cart was cleared upon sign-in transfer.
- **Multiple browser tabs with guest cart**: Cart operations across multiple tabs use last-write-wins eventual consistency. Each operation reads the current Square order state, applies its change, and writes back. The most recent write is authoritative. The next page load or interaction in any tab reflects the latest state.
- **Guest checkout with Square API failure**: Same error handling as authenticated checkout — guest stays on cart page, sees error message, cart items preserved, can retry.
- **Guest adds items, closes browser, returns days later**: Guest cart persists within reasonable session boundaries. If the session/cookie has expired, the cart resets to empty.
- **Guest on shared/device**: No expectation of cart isolation between users on the same device in guest mode. This is an inherent limitation of guest carts stored in browser.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow unauthenticated visitors to add products to a cart without requiring sign-in or account creation
- **FR-002**: System MUST persist the guest cart across page navigations and browser refreshes within the same browser session, without requiring authentication
- **FR-003**: System MUST display the cart page (`/cart`) for both authenticated and unauthenticated visitors, showing the same cart layout (line items, quantities, prices, subtotal) regardless of auth state
- **FR-004**: System MUST allow unauthenticated visitors to initiate checkout from their guest cart via the "Proceed to Checkout" button, generating a Square payment link without requiring a Square customer ID
- **FR-005**: System MUST disable the "Proceed to Checkout" button for guest carts containing unavailable items, matching the authenticated cart behavior
- **FR-006**: System MUST create a Square order from guest cart items at checkout time and attach it to the payment link, supporting guest orders without a customer reference
- **FR-007**: System MUST redirect guests to the Square-hosted payment page after payment link generation, using the same payment link flow as authenticated checkout
- **FR-008**: System MUST display the order confirmation page (`/order/result`) for guests returning from Square after payment, using the same query-parameter-based display as authenticated customers
- **FR-009**: System MUST transfer guest cart items to the authenticated customer's cart when an unauthenticated visitor signs in, merging duplicate items by summing quantities
- **FR-010**: System MUST clear the guest cart cookie after a successful payment link creation (before the guest is redirected to Square), and after a successful sign-in transfer (FR-009)
- **FR-011**: System MUST expire guest carts after a defined period of inactivity, showing an empty cart state on the next visit
- **FR-012**: System MUST provide a "Clear Cart" action for guest carts, immediately removing all items
- **FR-013**: System MUST handle Square API errors during guest checkout with the same grace and cart preservation as the authenticated checkout flow
- **FR-014**: System MUST retain the existing authenticated cart and checkout behavior unchanged — the guest path is additive, not a replacement
- **FR-015**: System MUST display the guest cart item count in the header navigation cart badge, using the same visual badge as the authenticated flow

### Key Entities

- **Guest Cart**: A temporary cart associated with an unauthenticated browser session. Contains product references, quantities, and prices captured at add-to-cart time. Lives entirely within the browser session (cookies or equivalent). Does not reference a Square customer ID. Expires after the inactivity period or upon sign-in transfer.
- **Guest Checkout Attempt**: A checkout initiated by an unauthenticated visitor. Creates a Square order without a customer reference, generates a payment link, and redirects to Square. Distinguished from authenticated checkout by the absence of a `squareCustomerId`.
- **Cart Transfer**: The process of moving guest cart items into an authenticated customer's Square draft order upon sign-in. Handles quantity merging for duplicate products between the guest cart and any pre-existing authenticated cart.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Unauthenticated visitors can add items to a cart and view their cart page without encountering a sign-in prompt or barrier
- **SC-002**: Guest cart items survive a full page refresh in the same browser (100% persistence rate within same session)
- **SC-003**: Unauthenticated visitors can complete the full checkout journey (add to cart → checkout → Square payment page redirect) without signing in, matching the authenticated checkout time of under 5 seconds for redirect
- **SC-004**: Guests who sign in mid-shopping retain 100% of their guest cart items in their authenticated cart after sign-in
- **SC-005**: The existing authenticated cart and checkout flow continues to work without regression — all existing cart and checkout tests pass unchanged
- **SC-006**: Guest cart expiry and clearance operate without affecting authenticated customer carts

## Assumptions

- Guest cart storage uses browser-side mechanisms (cookies or Web Storage API). Server-side guest cart storage (database) is out of scope for this feature.
- Square Payment Links API supports creating orders and payment links without a customer ID. Research will validate this during planning.
- Guest cart items are stored as product references (ID, variant ID, quantity) and prices are re-verified at checkout time against Square's catalog to prevent stale-price exploits.
- The guest cart expiry period is 7 days of inactivity. This value is a reasonable default and can be adjusted based on analytics.
- The existing cart page (`/cart`) and checkout flow from 023-shopping-cart and 024-checkout-flow are the foundation — this feature adds a guest path alongside the authenticated path.
- Clerk authentication and the existing `auth()` + `getSquareCustomerId()` pattern remain unchanged for authenticated customers.
- The `/order/result` page already functions without authentication (per 024-checkout-flow FR-010), so no changes are needed for guest post-payment return.
- Guest checkout uses the same Square Payment Links API and payment flow — the only difference is the absence of a customer ID on the Square order.
- No guest-to-account order linking is performed automatically. Guest orders completed before sign-in are not retroactively associated with an account.
- The Square-hosted payment page collects the buyer's email address for order receipts. The store does not collect, store, or prompt for guest email — Square handles this natively on its payment form.
- The guest cart cookie (`guest-cart-order-id`) stores a raw Square order ID without cryptographic signing in the MVP. Square order IDs are long random strings, making brute-force attacks impractical. Cart data is low-sensitivity (product names, quantities, prices). This risk is accepted for MVP and may be hardened in a future iteration.
