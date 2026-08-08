# Contract: Square Webhook Endpoint

**Feature**: 037-email-order-emails | **Date**: 2026-08-07

## Endpoint

```
POST /api/webhooks/square
```

Square delivers event notifications to this URL. It must be registered as the notification URL for a Square webhook subscription subscribed to the `payment.updated` event (Square has no `payment.completed` event). The handler only sends an email when the payment's `status` is `COMPLETED`.

## Request

- **Headers**: `x-square-hmacsha256-signature` — the HMAC-SHA256 signature Square generates for the raw body.
- **Body**: raw JSON of a Square webhook event. For `payment.updated` with a completed payment:

```json
{
  "type": "payment.updated",
  "event_id": "00000000-0000-0000-0000-000000000000",
  "data": {
    "type": "payment",
    "id": "PAYMENT_ID",
    "object": {
      "payment": {
        "id": "PAYMENT_ID",
        "status": "COMPLETED",
        "order_id": "ORDER_ID"
      }
    }
  }
}
```

## Signature verification

The raw body, the `x-square-hmacsha256-signature` header, the webhook signature key, and the notification URL are passed to `WebhooksHelper.verifySignature` (Square SDK). If it returns `false`, the request MUST be rejected with `403` and the body discarded.

## Response

| Case | Status | Body |
|------|--------|------|
| Signature invalid | `403` | `{ "error": "Invalid signature" }` |
| Non-`payment.updated` event | `200` | `{ "success": true }` (ignored) |
| `payment.updated` with non-COMPLETED status | `200` | `{ "success": true }` (ignored) |
| Signature valid, event handled | `200` | `{ "success": true }` |
| Missing webhook config | `500` | `{ "error": "Webhook not configured" }` |

The email send is fire-and-forget; the route returns `200` after verification and dispatch is initiated, so checkout is never blocked and Square does not retry spuriously. Email-send failures are logged and skipped (no retry).

## Configuration (environment)

- `SQUARE_WEBHOOK_URL` — the notification URL (must exactly match the one registered in Square; used in signature verification).
- `SQUARE_WEBHOOK_SIGNATURE_KEY` — the webhook signature key from the Square Developer portal.
- `RESEND_API_KEY` — used by the email send (see email contract).