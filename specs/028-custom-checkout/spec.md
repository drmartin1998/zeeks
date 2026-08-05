# Feature Specification: Custom Checkout Page Flow

**Feature Branch**: `028-custom-checkout`

**Created**: 2026-08-04

**Status**: Draft

**Input**: User description: "create a custom checkout page flow"

## Clarifications

### Session 2026-08-04

- Q: Should the custom checkout page completely replace Square payment links or coexist with them? → A: Replace entirely — all users go through the custom checkout page, payment links are removed.
- Q: What should the checkout page display while order data, customer profile, and loyalty rewards are being fetched? → A: Per-section skeleton placeholders for order summary, customer info, and payment form — each renders independently via Suspense boundaries as data arrives.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete Order with Payment on Custom Checkout Page (Priority: P1)

As a customer with items in my cart, I want to complete my purchase on a checkout page within the store that shows my order summary, applied loyalty rewards, and collects my payment information, so that I can see exactly what I'm paying and know my rewards were applied before I submit payment.

**Why this priority**: This is the core checkout flow — without it, customers cannot complete purchases. The hosted Square payment page currently doesn't display loyalty rewards, undermining the rewards redemption feature.

**Independent Test**: Add items to cart, select a loyalty reward, proceed to checkout. Verify the custom checkout page displays the order summary with items, the applied loyalty reward discount as a line item, the customer's name, and a payment form. Complete payment with a test card and verify the order is marked as paid.

**Acceptance Scenarios**:

1. **Given** a logged-in customer with items in their cart and a selected loyalty reward, **When** they click "Proceed to Checkout", **Then** they are taken to the checkout page showing their order summary, the applied reward discount as a visible line item, and a payment form
2. **Given** the checkout page is displayed with order summary and payment form, **When** the customer enters valid payment information and submits, **Then** the payment is processed, the order is completed, and the customer is redirected to an order confirmation page showing the successful transaction
3. **Given** the checkout page is displayed, **When** the customer enters invalid payment information, **Then** a specific error message is displayed next to the invalid field without clearing the form, and the customer can correct and retry
4. **Given** a logged-in customer with items but NO loyalty reward selected, **When** they proceed to checkout, **Then** the checkout page shows the order summary without any reward discount line items

---

### User Story 2 - View Applied Loyalty Reward on Checkout (Priority: P1)

As a customer who selected a loyalty reward, I want to see the reward discount reflected on the checkout page as a line item deduction from my order total, so I have confidence the reward was applied before I pay.

**Why this priority**: The primary motivation for building a custom checkout page is to make loyalty rewards visible at checkout. This is the feature that Square's hosted payment page cannot provide.

**Independent Test**: Select a "$10 Off" loyalty reward on the cart page, proceed to checkout. Verify the checkout page shows the $10 discount as a separate line item above the final total.

**Acceptance Scenarios**:

1. **Given** a customer with a "$10 Off Your Order" loyalty reward selected and items totaling $50 in their cart, **When** they view the checkout page, **Then** the order summary shows the subtotal ($50), the reward discount as "-$10.00", and the final total ($40)
2. **Given** a customer proceeds to checkout with a loyalty reward, **When** the payment page displays, **Then** the points remaining after the purchase is shown below the order summary
3. **Given** a customer with a percentage-based loyalty reward, **When** they view the checkout page, **Then** the discount amount is calculated and displayed as a line item

---

### User Story 3 - View Customer Information on Checkout (Priority: P2)

As a customer checking out, I want to see my saved contact information (name and email) on the checkout page so I can verify my details are correct before completing the purchase.

**Why this priority**: Customer confidence at checkout — verifying personal details reduces anxiety and support requests about wrong contact info on orders.

**Independent Test**: Log in, add items to cart, proceed to checkout. Verify the checkout page shows the customer's name and email address retrieved from their account.

**Acceptance Scenarios**:

1. **Given** a logged-in customer with saved profile information, **When** they navigate to the checkout page, **Then** their name and email address are pre-populated and displayed
2. **Given** the checkout page displays customer information, **When** the information is incorrect, **Then** the customer can navigate to their account settings to update it before completing the purchase

---

### Edge Cases

- What happens when the payment fails due to insufficient funds? The payment form shows the decline reason inline; the order stays in OPEN state; the customer can try a different card.
- What happens when the Square API is unreachable during payment processing? The customer sees an error message suggesting they try again; the order remains unprocessed.
- What happens when the customer navigates away from the checkout page and returns? The order is re-fetched from Square; the checkout page shows the current state of the order.
- What happens when the customer's loyalty reward points balance changes between cart and checkout (e.g., reward deleted)? The checkout page detects the missing reward and shows the order total without the discount, with a notification that the reward is no longer available.
- What happens if the customer double-clicks the Pay button? The payment form's submit button is disabled immediately on first click to prevent duplicate charges.
- What happens after successful payment if the customer refreshes? They are redirected to the order confirmation page, which shows the completed order — no duplicate payment can occur.
- What happens for guest checkout? Guests can still complete purchases but without loyalty rewards — the checkout page adapts to show only the order summary and payment form.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Checkout page MUST be a protected route accessible only to authenticated customers
- **FR-002**: Checkout page MUST display the complete order summary including: list of items with quantities and unit prices, subtotal, any applied loyalty reward discount as a separate line item, and the final total
- **FR-003**: Checkout page MUST display the customer's saved contact information (name, email) retrieved from their account profile
- **FR-004**: Checkout page MUST provide a payment form that collects credit card information (card number, expiration, CVC) and billing address (name, street address, city, state, postal code)
- **FR-005**: Payment form MUST validate card information before submission and display field-level errors for invalid input
- **FR-006**: System MUST process payments through Square's payment API using server-side communication — payment credentials must never be exposed to the browser beyond tokenization
- **FR-007**: System MUST create the loyalty reward on the customer's account, attach it to the order (via `order_id`), and process payment as a single atomic Server Action — order transitions from DRAFT to OPEN to COMPLETED in one user action
- **FR-008**: System MUST prevent duplicate payment submissions by disabling the pay button after the first click and using idempotency keys
- **FR-009**: After successful payment, system MUST redirect the customer to an order confirmation page showing order items, total paid, any applied loyalty reward discount, and the transaction reference number
- **FR-010**: After failed payment, system MUST display the decline reason to the customer, keep the order in OPEN state, and allow retry with different payment information
- **FR-011**: Checkout page MUST handle the case where a selected loyalty reward is no longer available (e.g., points insufficient) by showing the order total without the discount and notifying the customer
- **FR-012**: The checkout page MUST adapt for guest checkout — display order summary and payment form without customer information or loyalty rewards section
- **FR-013**: The checkout page MUST be responsive and usable on mobile, tablet, and desktop viewport widths
- **FR-014**: While order data, customer profile, and payment form are loading, per-section skeleton placeholders MUST render immediately to prevent layout shift; each section renders independently via Suspense boundaries as its data arrives

### Key Entities

- **Checkout Order**: The current order being paid, containing line items, subtotal, applied loyalty reward discount (if any), and final total
- **Payment**: The card transaction processed against the order, with attributes: amount, status (approved/declined), transaction ID, timestamp
- **Loyalty Reward Discount**: A line item on the order representing the reward applied, with the discount amount and the reward tier it originated from

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Customers can complete checkout and payment in under 2 minutes from page load to payment confirmation
- **SC-002**: Applied loyalty reward discounts are visible on the checkout page as a distinct line item in 100% of cases where a reward was selected
- **SC-003**: Payment form validation catches and displays errors for invalid card information before submission in under 1 second of field interaction
- **SC-004**: Zero instances of duplicate payments occur due to double-clicks or page refreshes during processing
- **SC-005**: The checkout page renders and is fully usable at viewport widths of 375px (mobile), 768px (tablet), and 1280px (desktop)

## Assumptions

- Credit card information is tokenized client-side by Square's provided libraries before being sent to the server — the server never handles raw card numbers
- The existing cart page and loyalty reward selection flow remain unchanged — this feature builds on top of them
- The customer's Square customer ID and loyalty account are already available via Clerk authentication (established in specs 008, 015, 016)
- The store's Square location ID and access token are configured and validated at application startup (per Constitution VII)
- Guest checkout already functions via the existing cart flow (spec 025) — this feature extends it with the custom payment page
- The order confirmation page replaces the current `/order/result` page that handles Square payment link redirects
- Only credit card payments are supported in the initial version — no digital wallets or alternative payment methods
