# Feature Specification: Square Checkout Flow

**Feature Branch**: `024-checkout-flow`

**Created**: 2026-08-03

**Status**: Draft

**Input**: User description: "as a user when I click checkout from the shopping cart I want to be taken to the Square payment page to complete my order."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initiate Checkout from Cart (Priority: P1)

A logged-in customer with items in their cart clicks the "Checkout" button. The system creates a Square payment link for the cart's draft order and redirects them to the Square-hosted payment page where they can enter payment details and complete their purchase. Square handles the order state transition from DRAFT to OPEN internally when the payment link is created.

**Why this priority**: This is the entire checkout flow. Without it, customers cannot convert their cart into an actual order. It is the critical path from browsing to revenue.

**Independent Test**: Add items to the cart, click "Checkout" from the cart page, and verify redirection to a Square-hosted payment page. The payment link's order total, as reflected in the Square payment page URL metadata, matches the cart subtotal.

**Acceptance Scenarios**:

1. **Given** a logged-in customer with a non-empty cart (Square draft order with line items), **When** they click the "Checkout" button on the cart page, **Then** a Square payment link is generated with a unique idempotency key for the order, and the customer is redirected to the Square-hosted payment page
2. **Given** a logged-in customer with a non-empty cart, **When** a payment link is generated and they are redirected, **Then** the payment link references the correct order total (sum of cart line items) and the customer can enter payment information on the Square-hosted page
3. **Given** a logged-in customer with a cart containing an unavailable item (flagged as out of stock), **When** they view the cart page, **Then** the "Checkout" button is both visually grayed out AND non-interactive (clicking produces no action), and a message is displayed explaining that unavailable items must be removed before checking out

---

### User Story 2 - Handle Checkout Errors (Priority: P2)

When the checkout process encounters an error (Square API failure, network issue, missing cart), the system provides clear feedback and preserves the cart state so the customer can retry. Error messages are user-friendly and distinguish between temporary failures (retry encouraged) and permanent issues (requires action, such as removing unavailable items).

**Why this priority**: Checkout failures can lose sales. Graceful error handling ensures customers aren't left confused or unable to retry.

**Independent Test**: Simulate a Square API server error (5xx) during checkout and verify the customer sees an error message on the cart page encouraging retry, with their cart intact and the "Checkout" button available. Also simulate an authentication expiration mid-session and verify redirect to sign-in.

**Acceptance Scenarios**:

1. **Given** a logged-in customer clicking "Checkout", **When** the Square API returns a server error (5xx) during payment link generation, **Then** the customer remains on the cart page, sees a message indicating a temporary issue and suggesting they try again, and their cart (draft order) is preserved unchanged
2. **Given** a logged-in customer clicking "Checkout", **When** the Square API returns a client error (4xx, e.g., order not found or invalid state), **Then** the customer remains on the cart page, sees a specific message indicating the issue (e.g., "Cart not found" or "Some items are no longer available"), and their cart is preserved
3. **Given** a logged-in customer with an empty cart, **When** they attempt to navigate directly to a checkout URL or submit the checkout form, **Then** they are redirected back to the cart page with a message that the cart is empty
4. **Given** a customer whose authentication session expires between loading the cart page and clicking "Checkout", **When** they submit the checkout action, **Then** they are redirected to the sign-in page, and after signing in, the cart items remain available

---

### User Story 3 - Return from Square Payment Page (Priority: P3)

After completing or cancelling payment on the Square-hosted page, the customer is directed back to the store at a single return page (`/order/result`) which reads Square's query parameters (`status` and `transactionId`) to display the appropriate view. The return page works even if the customer's authentication session has expired (graceful display without requiring sign-in).

**Why this priority**: Completing the order lifecycle matters, but the primary action is getting the customer to Square. The return flow can be a fast-follow delivered after the redirect works.

**Independent Test**: Navigate to `/order/result?status=COMPLETED&transactionId=test123` and verify the confirmation view with order number and item summary. Navigate to `/order/result?status=CANCELLED` and verify the cancellation view.

**Acceptance Scenarios**:

1. **Given** a customer who has completed payment on the Square payment page, **When** Square redirects them back to the store with `?status=COMPLETED&transactionId=...`, **Then** they see an order confirmation page with the transaction ID as the order reference, a list of items from the cart, and a "Continue Shopping" link
2. **Given** a customer who cancelled payment on the Square payment page, **When** Square redirects them back to the store with `?status=CANCELLED`, **Then** they see a message indicating payment was not completed and no charge was made, with a "Return to Cart" link. The exact same cart items (same draft order) remain available — the draft order was never modified during the checkout attempt.
3. **Given** a customer returning from Square with missing or unrecognized status parameters, **When** the return page cannot determine the payment outcome, **Then** they see a generic order status message with a "View Orders" link and no error is displayed

---

### Edge Cases

- **Customer closes browser during payment on Square page**: The Square order remains in a pending state. If the customer returns and payment was not completed, they can initiate a new checkout with a fresh idempotency key. If payment completed but the redirect was lost, the order confirmation is accessible via order history.
- **Square payment link expires before customer completes payment**: Square payment links have a built-in expiry (typically 30 days). If the customer clicks "Checkout" but does not complete payment within the validity period, they see Square's default expiry page. A new checkout attempt generates a fresh payment link with a new idempotency key — this is safe because the previous attempt used a different key, preventing duplicate payment links.
- **Cart state changes between checkout initiation and payment**: Since the draft order is associated with the payment link at creation time, the line items are locked at that moment. Any subsequent cart changes (add, remove, quantity update) are on a new draft order.
- **Customer has items from multiple checkout attempts**: Each checkout attempt creates a new payment link referencing the draft order. If the customer abandons checkout and returns, their cart (a new or existing draft order) reflects current state. Abandoned pending orders remain in Square but do not affect the current cart.
- **Slow Square API response for payment link generation**: The customer sees a loading state on the cart page while checkout is being processed. The "Checkout" button is replaced with a loading indicator (spinner with "Redirecting to checkout..." text). If the request exceeds 10 seconds, it is treated as a timeout error and the customer is shown an error message on the cart page.
- **Customer double-clicks the "Checkout" button**: The button is disabled immediately on first click (before the server action completes) to prevent duplicate submissions. Only one payment link is created per checkout attempt.
- **Customer clicks browser "back" after being redirected to Square**: Returning to the cart page shows the cart in its current state. If the payment link was already created, the draft order has been converted by Square; a new draft order will exist if the customer makes further cart changes.
- **Authentication expires during checkout**: The server action detects the expired session and redirects to sign-in instead of proceeding. No partial checkout state is created.
- **Square payment link URL is inaccessible after redirect**: This is a Square-hosted page availability issue. The store does not intercept or proxy the Square page. If Square is unavailable, the customer's browser shows a connection error from Square's domain — not the store's.
- **Return redirect parameters are missing or malformed**: The return page defaults to a generic "Order Status" view with a "View Orders" link. No error or crash occurs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a "Checkout" button on the cart page that is visible and both visually active (styled as clickable) and functionally enabled (responds to click/tap/Enter key) only when the cart contains at least one available (in-stock) line item
- **FR-002**: System MUST render the "Checkout" button as both visually grayed out AND non-interactive (ignores click, tap, and keyboard activation events) when any cart line item is flagged as unavailable (out of stock or delisted), and display an explanatory message near the button
- **FR-003**: System MUST provide the customer's Square draft order to the Square Payment Links API when checkout is initiated; Square handles the DRAFT-to-OPEN state transition internally when the payment link is created
- **FR-004**: System MUST generate a Square payment link with a unique idempotency key per checkout attempt to prevent duplicate payment links
- **FR-005**: System MUST redirect the customer to the Square-hosted payment page after the payment link is generated
- **FR-006**: System MUST preserve the cart state (the draft order is never modified by a failed checkout attempt) and display a user-facing error message if checkout initiation fails. Error messages MUST distinguish between temporary failures ("Checkout is temporarily unavailable. Please try again.") and permanent issues (e.g., "Some items in your cart are no longer available. Please remove them to continue.")
- **FR-007**: System MUST redirect the customer back to the cart page with a message indicating the cart is empty if they attempt to checkout with an empty cart
- **FR-008**: System MUST replace the "Checkout" button with a loading indicator (spinner with accompanying "Redirecting to checkout..." text) while the checkout process is in progress, and disable the button on first click to prevent duplicate submissions
- **FR-009**: System MUST include a return URL in the Square payment link that points to the store's `/order/result` page. The URL MUST use the deployment's base URL (from `VERCEL_URL` environment variable or derived equivalent) so Square can redirect back after payment completion or cancellation
- **FR-010**: System MUST display an order confirmation page at `/order/result` when the return query parameter `status=COMPLETED`, showing the transaction ID as the order reference, a summary list of items purchased, and a "Continue Shopping" link. The page MUST function without requiring authentication (graceful for expired sessions). If the order data fetch fails, the page MUST still display the transaction ID and a "View Orders" link without crashing.
- **FR-011**: System MUST display a cancellation page at `/order/result` when the return query parameter `status=CANCELLED`, showing a message that no charge was made and a "Return to Cart" link. The exact same draft order (same order ID) remains available — the checkout attempt did not modify it.
- **FR-012**: System MUST require authentication before initiating checkout; unauthenticated users MUST be redirected to sign in. If authentication expires between page load and form submission, the server action MUST redirect to sign-in rather than creating partial checkout state.
- **FR-013**: System MUST use an accessible `aria-label` on the "Checkout" button (e.g., "Proceed to Checkout") and support activation via both click/tap and keyboard (Enter/Space)
- **FR-014**: System MUST never collect, store, or transmit cardholder data (card numbers, CVV, expiry). All payment data collection is handled exclusively by Square on the Square-hosted payment page. The store's only interaction with payment data is the payment link URL and transaction ID returned by Square.

### Key Entities

- **Pending Order**: A Square Order in a non-DRAFT state (transitioned to OPEN by Square when the payment link is created). Contains the locked-in line items, customer reference, and fulfillment details. This order is the source of truth for what the customer is paying for.
- **Square Payment Link**: A URL generated via Square's Payment Links API that directs the customer to a Square-hosted payment form. Created with a unique idempotency key per attempt. Contains the order ID, total amount, currency, and a return URL (`/order/result`) for post-payment redirection.
- **Order Confirmation**: The display state at `/order/result?status=COMPLETED` showing the transaction ID (from Square's redirect query parameter) as the order reference and an item summary. Derived from Square's redirect query parameters and optionally enriched by fetching order data from Square.
- **Checkout Attempt**: A single invocation of the checkout action, identified by a unique idempotency key. If the customer retries after a failure or after a payment link expires, a new attempt with a new key is created.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Customers can click "Checkout" from their cart and be redirected to a Square payment page within 5 seconds of clicking the button (measured from button click to browser navigation to the Square URL)
- **SC-002**: 100% of successful checkout payment link creations reference the correct order total matching the cart subtotal (verified by comparing the cart subtotal at checkout time to the order total passed to Square's API, both observable server-side)
- **SC-003**: Checkout errors result in the customer staying on the cart page with their cart intact (zero draft order modifications on failure)
- **SC-004**: The order result page (`/order/result`) renders within 3 seconds of the customer being redirected back from Square
- **SC-005**: The "Checkout" button is correctly disabled (both visually grayed out and non-interactive) when any cart item is unavailable — zero instances where an unavailable-item cart shows an active checkout button

## Assumptions

- The "Checkout" button on the cart page is part of the shopping cart feature (023-shopping-cart) and will be wired to this checkout flow. If the button does not yet exist, it must be added as a prerequisite.
- Customers must be logged in to checkout; authentication is handled by existing Clerk integration (014-clerk-sign-in, 013-clerk-webhooks).
- Square Payment Links API is available in both sandbox and production Square environments. If the Square API is unreachable or returns errors, the checkout flow displays an error message on the cart page with cart preserved.
- The Square Payment Links API accepts orders in DRAFT state and handles the state transition to OPEN internally when the payment link is created. No separate order update call is needed from the store.
- Square payment links include a built-in expiry period. A new checkout attempt generates a fresh payment link with a new idempotency key.
- The Square Payment Links API configures tax and shipping calculations on the Square-hosted payment page based on the order total and location settings. The store does not compute or display tax/shipping on the cart page — Square handles this.
- The cart page lives at `/cart` (established by 023-shopping-cart).
- The return URL from Square points to `/order/result` within the store. The store uses `VERCEL_URL` (or equivalent) to construct the full return URL dynamically for each deployment environment.
- The Square payment page is hosted by Square; the store does not collect, store, or process payment card details. All payment data collection is within Square's PCI-compliant boundary.
- Post-checkout order history viewing is a separate feature (022-order-transactions-view) and is not duplicated here. The confirmation page displays the transaction ID from Square's redirect; detailed order information is fetched from Square by the order history feature.
- The `/order/result` page reads query parameters from Square's redirect and does not depend on authentication — it handles expired sessions gracefully.
