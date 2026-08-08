# Quickstart: Validating Resend Order Emails

**Feature**: 037-brevo-order-emails | **Date**: 2026-08-07

This guide documents runnable validation scenarios that prove order-confirmation emails work end-to-end. It references the [data model](./data-model.md) and [contracts](./contracts/) rather than duplicating them.

## Prerequisites

- Local dev server via `vercel dev` (see `.clinerules/dev-server.md` — check `lsof -ti:3000` first).
- Square webhook subscription configured to `payment.updated`, pointing at the `POST /api/webhooks/square` URL.
- Environment variables set: `RESEND_API_KEY`, `SQUARE_WEBHOOK_URL`, `SQUARE_WEBHOOK_SIGNATURE_KEY`.
- A verified Resend sender (`orders@zeekscg.com`).

## Setup

```bash
npm install        # ensures resend is installed
vercel dev         # or reuse existing server on :3000
tsc --noEmit
npm run lint
```

## Validation scenarios

### Scenario 1 — Signature verification

Send a `payment.updated` webhook WITHOUT a valid signature:

```bash
curl -X POST http://localhost:3000/api/webhooks/square \
  -H "Content-Type: application/json" \
  -d '{"type":"payment.updated","data":{"object":{"payment":{"order_id":"ORDER_ID"}}}}'
```

**Expected**: `403` (no `x-square-hmacsha256-signature` header → invalid). The event is discarded.

### Scenario 2 — Order confirmation email sent

Send a `payment.updated` webhook with a valid signature (see the [Square webhook contract](./contracts/square-webhook.md)) for a real completed order.

**Expected**: `200`, and an email is delivered to the customer's address containing the full order ID, the itemized items (name, quantity, unit price, line total), and the subtotal.

### Scenario 3 — Correct recipient

- **Signed-in customer**: completes an order → email goes to their account email.
- **Guest**: completes checkout with a billing email → email goes to that billing email.

**Expected**: The recipient matches the order's customer/billing email; no email is sent to a fabricated address.

### Scenario 4 — Email send failure does not block

Temporarily set `RESEND_API_KEY` to an invalid value, then send a valid `payment.updated` webhook.

**Expected**: The webhook returns `200` (order flow unaffected) and the send failure is logged; no exception surfaces to the caller.

### Scenario 5 — Non-trigger event ignored

Send a valid webhook for a non-`payment.updated` event (e.g., `payment.refunded`).

**Expected**: `200`, and no email is sent.

## Automated tests

```bash
npm test              # Vitest — unit (email content builder, signature helper) + integration (webhook route with MSW)
npm run test:e2e      # Playwright — optional; not part of the critical path
```

See `data-model.md` for the email/event invariants and `contracts/square-webhook.md` / `contracts/email-email.md` for the interfaces.