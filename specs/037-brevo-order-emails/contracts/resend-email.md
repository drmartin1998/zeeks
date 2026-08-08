# Contract: Resend Transactional Email Send

**Feature**: 037-brevo-order-emails | **Date**: 2026-08-07

## Interface

`sendTransactionalEmail(message): Promise<void>` — sends a transactional email via Resend. On failure it logs and resolves (does not throw to the caller), honoring the fire-and-forget / no-retry behavior.

## Request to Resend

Uses the `resend` Node SDK `emails.send`:

```json
{
  "from": "Zeeks <orders@zeekscg.com>",
  "to": ["<customer-email>"],
  "subject": "Your Zeeks order confirmation",
  "html": "<html>...</html>",
  "text": "Plain text order confirmation..."
}
```

- **`from`**: `Zeeks <orders@zeekscg.com>` (clarification Q1) — must be a verified domain in Resend.
- **`html`**: styled HTML (clarification Q3 / FR-010).
- **`text`**: plain-text fallback (clarification Q3 / FR-010).
- **`to`**: the customer's email (FR-002/FR-003/FR-004).

## Auth

Authenticated with the `RESEND_API_KEY` environment variable (passed to `new Resend(apiKey)`). No SMTP credentials are required.

## Message shape (internal)

```ts
interface OrderEmailMessage {
  to: { email: string; name?: string };
  sender: { email: string; name: string };
  subject: string;
  htmlContent: string;
  textContent: string;
}
```

## Behavior

- Requires `RESEND_API_KEY` (env). If missing, log and skip.
- On Resend API error, log the error and skip (no retry, clarification Q5).
- Never blocks the caller (fire-and-forget).