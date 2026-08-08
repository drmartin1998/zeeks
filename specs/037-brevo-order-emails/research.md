# Research: Resend Order Emails

**Feature**: 037-brevo-order-emails | **Date**: 2026-08-07

Research resolves the email-sending and webhook integration decisions for sending order-confirmation emails.

## 1. Email service integration (Resend)

**Decision**: Use the `resend` Node SDK (`resend.emails.send`) to send the confirmation email. Configure the client with `RESEND_API_KEY`.

**Rationale**: Resend's official SDK is the supported, well-documented path for transactional email. `emails.send` accepts `from`, `to`, `subject`, `html`, and `text`, which directly supports the styled-HTML + plain-text-fallback requirement (clarification Q3). The `RESEND_API_KEY` is read from the environment (Constitution VII).

**Alternatives considered**:
- *Raw REST call to `https://api.resend.com/emails`* — viable but reinvents the SDK; the SDK is cleaner and typed.
- *Resend transactional template by ID* — rejected for v1; building the content as a pure function is simpler to test and keeps the order details dynamic.

## 2. Webhook trigger (Square `payment.updated`)

**Decision**: Add a new Square webhook route `app/api/webhooks/square/route.ts` subscribed to the `payment.updated` event. On receipt, extract the `order_id` from the event payload, fetch the order, resolve the customer email, and send the confirmation email.

**Rationale**: The spec (clarification Q2) requires the email to be triggered by a Square webhook event and never block checkout. `payment.updated` (clarification Q4) fires only after payment succeeds, matching "when an order is completed." The webhook route is async and fire-and-forget for the email send, so checkout is unaffected.

**Alternatives considered**:
- *Send synchronously in `processPayment`* — rejected (clarification Q2: async via webhook).
- *`order.updated` event* — rejected (clarification Q4: use `payment.updated`).

## 3. Webhook signature verification

**Decision**: Use `WebhooksHelper.verifySignature` from the Square SDK (v45.0.1, which exports it) to validate the `x-square-hmacsha256-signature` header. The helper requires the raw request body, the signature header, the webhook signature key, and the notification URL.

**Rationale**: A public webhook endpoint must verify payloads came from Square. The SDK's `WebhooksHelper` implements the constant-time HMAC-SHA256 comparison and is the officially recommended utility (per Square docs). Configuring it requires the notification URL and signature key from the environment (`SQUARE_WEBHOOK_URL`, `SQUARE_WEBHOOK_SIGNATURE_KEY`).

**Alternatives considered**:
- *Hand-rolled `crypto.createHmac` comparison* — rejected; the SDK helper is safer (constant-time) and less code.

## 4. Resolving the customer email

**Decision**: Resolve the recipient from the order context:
- The Square `payment.updated` event / payment object may carry customer info; otherwise fetch the order and its customer.
- For signed-in customers, use the email from the Square customer record.
- For guest checkout, use the `billingEmail` captured at checkout (feature 029/025 requirement).

**Rationale**: The spec (FR-003, FR-004) requires the email to go to the correct recipient. The email is never fabricated (FR-008).

## 5. Email content (styled HTML + plain text)

**Decision**: Build the email content as a pure function (`buildOrderConfirmationEmail`) returning `{ html, text, subject }`. The HTML is a readable confirmation with the order ID, itemized line items (name, quantity, unit price, line total), and subtotal; the text is a plain fallback. Both sent via `emails.send` (`html` + `text`).

**Rationale**: Pure-function content is fully unit-testable (Constitution VI). Sending both formats satisfies the fallback requirement.

## 6. Failure handling and timing

**Decision**: The email send is fire-and-forget from the webhook handler. On failure, log the error and skip (no retry, per clarification Q5). The webhook always returns 200 to Square after successfully parsing/verifying (so Square doesn't retry spuriously), and failures are logged.

**Rationale**: Matches the spec (FR-006, FR-007) and clarification Q5. Checkout is never blocked.

## Consolidated decisions

- **D1**: Resend via the `resend` SDK `emails.send`, keyed by `RESEND_API_KEY`.
- **D2**: New Square webhook route on `payment.updated`.
- **D3**: Webhook signature verified with Square SDK `WebhooksHelper.verifySignature`.
- **D4**: Recipient email from Square customer (signed-in) or billing email (guest).
- **D5**: Email content built by a pure function (HTML + plain text).
- **D6**: Fire-and-forget send; failures logged and skipped (no retry); webhook returns 200 after verification.