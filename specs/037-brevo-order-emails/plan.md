# Implementation Plan: Resend Order Emails

**Branch**: `037-brevo-order-emails` | **Date**: 2026-08-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/037-brevo-order-emails/spec.md`

## Summary

Send an order-confirmation email via Resend when a Square `payment.updated` webhook event is received. The email goes to the customer's email (account email for signed-in users, billing email for guests), includes the full order ID, itemized line items, and subtotal, and is sent asynchronously so it never blocks checkout. Emails are styled HTML with a plain-text fallback, sent from `orders@zeekscg.com`, using the `RESEND_API_KEY`. Sending failures are logged and skipped (no retry).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: Next.js 16.x (App Router), Square SDK 45.x, Resend API (`resend` or direct REST), Node crypto (webhook signature HMAC)

**Storage**: N/A — no persistent store; order data fetched from Square on demand

**Testing**: Vitest + @testing-library/react + MSW (unit/integration for webhook route + email service), Playwright (optional E2E)

**Target Platform**: Vercel (serverless), Node runtime

**Project Type**: Next.js App Router web application (single project, `@/*` path alias)

**Performance Goals**: Webhook handling returns quickly (no synchronous email send); email dispatch happens in the background / fire-and-forget (SC-002: dispatched within 60s)

**Constraints**: Square webhook signature MUST be verified (HMAC-SHA256 with the webhook signature key); `RESEND_API_KEY` and webhook secret from env (Constitution VII); order data MUST be fetched server-side via Square SDK (Constitution II); email sending must never block checkout

**Scale/Scope**: 1 new webhook route (`app/api/webhooks/square/route.ts`), 1 email service module (`lib/email/`), 1 webhook signature util, 8 functional requirements, 7 Gherkin scenarios

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | ✅ PASS | The webhook route runs server-side; no client components involved. Order fetch and email send happen in the server route. |
| II | API Route Security | ✅ PASS | Square order data fetched via the Square SDK server-side; `RESEND_API_KEY` and webhook signature key never exposed to the browser. Webhook signature verified (HMAC). |
| III | Type-Safe Data Flow | ✅ PASS | Typed `OrderConfirmationEmail` payload and webhook event types in `lib/square/types.ts`; Zod or explicit validation of the webhook body. `@/*` imports throughout. |
| IV | Component Architecture | ✅ PASS | Email content built as a pure function returning HTML/plain-text strings; no UI components needed. |
| V | Performance & Caching | ✅ PASS | Webhook route is async/fire-and-forget for the email send; no blocking synchronous work that delays the response. |
| VI | Gherkin-First Testing (Testing Trophy) | ✅ PASS | `.feature` file exists (7 scenarios). Integration tests for the webhook route (signature verification + email dispatch) with MSW; unit tests for the email builder. |
| VII | No Mock Data Fallback | ✅ PASS | Order data fetched from Square; customer email from the order context. On email failure, the failure is logged and skipped — no substitute data. |

## Project Structure

### Documentation (this feature)

```text
specs/037-brevo-order-emails/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
├── features/
│   └── brevo-order-emails.feature   # Gherkin scenarios (7)
└── checklists/
    └── requirements.md              # Quality checklist
```

### Source Code (repository root) — key files

```text
app/api/webhooks/square/route.ts     # NEW: Square webhook endpoint (verify signature, handle payment.updated)
lib/email/
├── resend.ts                      # NEW: sendTransactionalEmail() using RESEND_API_KEY
├── order-email.ts                  # NEW: buildOrderConfirmationEmail() → { html, text, subject } (pure)
└── __tests__/
    └── order-email.test.ts         # Unit tests for email content builder
lib/webhooks/
├── square-signature.ts             # NEW: verifySquareWebhookSignature() (HMAC-SHA256)
└── __tests__/
    └── square-signature.test.ts    # Unit tests for signature verification
lib/square/types.ts                 # ADD: OrderConfirmationEmail, SquareWebhookEvent types
tests/setup/                        # MSW handlers for Resend + Square as needed
```

**Structure Decision**: Single Next.js App Router project. The Square webhook is a new REST route that verifies the HMAC signature, extracts the `order_id` from the `payment.updated` event, fetches the order via the existing `getCart()`/`ordersApi`, resolves the customer email, builds the email content (pure function), and sends it via Resend (fire-and-forget). The email builder is a pure function so it is fully unit-testable.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. Square webhook signature verification requires a small HMAC helper (the SDK does not provide one), which is contained in `lib/webhooks/square-signature.ts`.