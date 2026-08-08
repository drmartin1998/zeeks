# Data Model: Resend Order Emails

**Feature**: 037-brevo-order-emails | **Date**: 2026-08-07

## Entities

### OrderConfirmationEmail

The email sent to a customer when their order completes. Content is built as a pure value.

| Field | Type | Description |
|-------|------|-------------|
| `to` | `{ email: string; name?: string }` | Recipient — the customer's email (account or billing email). |
| `sender` | `{ email: string; name: string }` | From address — `orders@zeekscg.com` (clarification Q1). |
| `subject` | `string` | Subject line (order confirmation). |
| `htmlContent` | `string` | Styled HTML body with order details (clarification Q3). |
| `textContent` | `string` | Plain-text fallback body with the same order details. |
| `orderId` | `string` | The full order ID (FR-002). |
| `lineItems` | `EmailLineItem[]` | Purchased items with name, quantity, unit price, line total. |
| `subtotal` | `{ amount: number; currency: string }` | Order subtotal. |

**Validation / invariants**:
- `to.email` MUST be a valid email and MUST NOT be fabricated (FR-008).
- `orderId`, `lineItems`, and `subtotal` MUST be included (FR-002).
- `htmlContent` and `textContent` MUST both be present (FR-010).

### EmailLineItem

A single item in the order confirmation email.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Product name. |
| `quantity` | `number` | Quantity ordered. |
| `unitPrice` | `number` | Unit price in currency minor units (cents). |
| `lineTotal` | `number` | Line total in currency minor units. |

### SquareWebhookEvent

The incoming Square webhook payload (generalized).

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | Event type, e.g. `payment.updated`. |
| `eventId` | `string` | Unique event identifier (for dedup/logging). |
| `data` | `{ type: string; id: string; object: unknown }` | Event payload; for `payment.updated`, `data.object.payment.order_id` holds the order ID. |

**Validation**:
- The webhook signature MUST be verified before any processing (FR security).
- `type === "payment.updated"` with `status === "COMPLETED"` is the trigger (FR-001).

## Data flow

1. Square sends a `payment.updated` webhook to `app/api/webhooks/square/route.ts`.
2. The route verifies the `x-square-hmacsha256-signature` header via `WebhooksHelper.verifySignature`.
3. On valid signature, the route parses the event and extracts `order_id` from `data.object.payment`.
4. The route fetches the order (via existing `getCart()`/`ordersApi`) to get line items and subtotal.
5. The route resolves the customer email (Square customer email or the order's billing email).
6. `buildOrderConfirmationEmail(...)` produces `{ html, text, subject }`.
7. `sendTransactionalEmail(...)` sends via Resend (fire-and-forget).
8. On send failure, log and skip (no retry).

## State transitions

### Email send lifecycle

| From | Trigger | To |
|------|---------|-----|
| Webhook received | Signature verified | Processing |
| Processing | Order fetched + email resolved | Sending |
| Sending | Resend success | Sent (logged) |
| Sending | Resend failure | Failed (logged, skipped) |

There is no retry state (clarification Q5).

## Relationships

- A `SquareWebhookEvent` (payment.updated) references an order via `order_id`.
- An `OrderConfirmationEmail` is derived from that order's line items and subtotal.
- The recipient email is the customer's account email (signed-in) or the order billing email (guest).