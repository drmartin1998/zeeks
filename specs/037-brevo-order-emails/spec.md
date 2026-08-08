# Feature Specification: Resend Order Emails

**Feature Branch**: `037-brevo-order-emails`

**Created**: 2026-08-07

**Status**: Draft

**Input**: User description: "when an order is completed we need to send an email to the person who placed the order with the order confirmation details. We will use Resend and the RESEND_API_KEY environment variable."

## Clarifications

### Session 2026-08-07

- Q: What "from" email address and sender name should appear on the order confirmation emails? → A: Use `orders@zeekscg.com` as the sender address.
- Q: Should the email be sent synchronously during checkout or asynchronously? → A: Send asynchronously, triggered by a Square webhook event; the email never blocks checkout.
- Q: What content format should the confirmation email use? → A: Styled HTML email with a plain-text fallback.
- Q: Which Square webhook event should trigger the order confirmation email? → A: `payment.updated` when the payment status is `COMPLETED` (Square has no `payment.completed` event; send only after payment succeeds).
- Q: If the email fails to send, should the system retry it automatically? → A: No retry; log the failure and skip the email.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Order Confirmation Email on Completion (Priority: P1)

When a customer completes an order (payment succeeds), a Square webhook event notifies the system, which sends an email to the address associated with the order. The email contains the order confirmation details: the order ID, the items purchased with quantities and prices, the order subtotal, and a confirmation message. The customer can read the email at their leisure and use the order ID to reference their purchase with support. Sending the email is asynchronous and never blocks the customer's checkout.

**Why this priority**: The order confirmation email is a critical transactional communication — it confirms the purchase, provides the customer a record of what they bought, and supplies the order reference they may need. It is the core deliverable of this feature and depends on nothing else, so it is P1.

**Independent Test**: Can be fully tested by completing a checkout and verifying that an email is sent to the order's email address with the order ID, itemized line items, quantities, unit prices, and subtotal.

**Acceptance Scenarios**:

1. **Given** a customer places an order and payment succeeds, **When** the order-completion webhook event is received, **Then** an email is sent to the customer's email address containing the order confirmation details.
2. **Given** an order email is sent, **When** the customer opens it, **Then** the email includes the full order ID, a list of purchased items with quantities and prices, and the order subtotal.
3. **Given** a completed order, **When** the email is sent, **Then** the email is addressed to the customer who placed the order (their provided email), not to a generic address.

---

### User Story 2 - Email for Signed-In Customers (Priority: P2)

A signed-in customer completes an order. The confirmation email is sent to the email address associated with their account (the Square customer profile), which is already known at checkout. The email content is identical to the guest case.

**Why this priority**: Signed-in customers already have an email on file, so the email must go to that address. This is a natural extension of the guest flow and is P2 because it reuses the same sending mechanism with a different recipient source.

**Independent Test**: Can be fully tested by completing checkout while signed in and verifying the email is sent to the account's email address with the same confirmation details.

**Acceptance Scenarios**:

1. **Given** a signed-in customer completes an order, **When** the order is complete, **Then** the confirmation email is sent to the email address on their account.
2. **Given** a signed-in order completion, **When** the email is sent, **Then** it contains the same order confirmation details as a guest order.

---

### User Story 3 - Graceful Failure When Email Cannot Be Sent (Priority: P3)

If the email cannot be sent (e.g., the email service is unavailable or the API key is invalid), the order completion must still proceed and the customer must not see a failure. The email-sending failure is logged and does not block the purchase or the order confirmation page.

**Why this priority**: The order itself is the primary transaction; the email is a best-effort notification. Blocking checkout on an email failure would hurt conversions, so graceful degradation is important but is a refinement over the core sending, hence P3.

**Independent Test**: Can be fully tested by simulating an email-service failure during checkout and verifying the order still completes and the confirmation page still loads, with the failure logged.

**Acceptance Scenarios**:

1. **Given** an order completes but the email service cannot be reached, **When** the order is marked complete, **Then** the order still completes successfully and the customer is not shown an error.
2. **Given** an email-sending failure, **When** it occurs, **Then** the failure is logged for review without interrupting the checkout.

---

### Edge Cases

- What happens when the customer's email address is missing or invalid? The email should not be sent, and the failure should be logged without blocking the order.
- What happens when the items list is empty or the order cannot be fetched? The email should not be sent (or should be sent with a clear message), and the error logged.
- What happens if the email service is briefly unavailable? The order completes; the email failure is logged and the email is skipped (no retry in v1).
- What happens with a guest order that has no email? The email cannot be sent; the order still completes and the issue is logged.
- What happens if the API key is misconfigured? The email send fails gracefully; checkout is unaffected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When an order is completed (payment succeeds), the system MUST send an email to the email address associated with that order, triggered by the Square `payment.updated` webhook event when the payment status is `COMPLETED`.
- **FR-002**: The email MUST contain the order confirmation details: the full order ID, the list of purchased items (name, quantity, unit price, line total), and the order subtotal.
- **FR-003**: For a signed-in customer, the email MUST be sent to the email address on their account.
- **FR-004**: For a guest checkout, the email MUST be sent to the email address provided during checkout.
- **FR-005**: The email service MUST be configured via the `RESEND_API_KEY` environment variable.
- **FR-006**: Email sending MUST NOT block checkout; the email is sent asynchronously after the webhook event, and if it cannot be sent the order MUST still complete successfully and the customer MUST NOT be shown an error.
- **FR-007**: Email-sending failures MUST be logged for review.
- **FR-008**: The feature MUST use the customer's email from the order context; it MUST NOT fabricate or substitute an email address.
- **FR-009**: The email MUST be sent from the configured sender address (`orders@zeekscg.com`), which is a verified Resend sender.
- **FR-010**: The email MUST be a styled HTML message with a plain-text fallback for clients that do not render HTML.

### Key Entities *(include if feature involves data)*

- **Order**: The completed order containing the order ID, line items (name, quantity, unit price, line total), and subtotal — the source of the confirmation details.
- **Customer Email**: The recipient address — the Square customer profile email for signed-in users, or the billing email provided during guest checkout.
- **Order Confirmation Email**: The transactional email sent to the customer containing the order details.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successfully completed orders trigger an email-send attempt to the correct customer email address.
- **SC-002**: The confirmation email is dispatched within 60 seconds of order completion.
- **SC-003**: The email reliably includes the order ID, all line items, and the subtotal (verified by at least one successful mailbox test).
- **SC-004**: Order completion is never blocked or delayed by an email-sending failure (0% of payments fail due to email issues).

## Assumptions

- The email service (Resend) is reachable and the `RESEND_API_KEY` is valid in the target environment.
- The customer's email address is available at order completion: from the account profile for signed-in customers, or from the required billing email for guest checkout.
- The email is sent asynchronously, triggered by a Square webhook event; it never blocks or delays the customer's checkout.
- A single email is sent per completed order; if the send fails, the failure is logged and the email is skipped (no automatic retry in v1).
- The email is a transactional confirmation rendered as styled HTML with a plain-text fallback (no attachments, no marketing content).
- The email is sent from `orders@zeekscg.com`, a verified Resend sender.
- The order-confirmation email is a best-effort notification and does not affect the success of the underlying purchase.