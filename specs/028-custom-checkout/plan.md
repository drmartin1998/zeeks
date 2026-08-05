# Implementation Plan: Custom Checkout Page Flow

**Branch**: `028-custom-checkout` | **Date**: 2026-08-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/028-custom-checkout/spec.md`

## Summary

Replace Square payment links with a custom checkout page that displays the order summary, applied loyalty rewards (as visible discount line items), customer information, and a credit card payment form. Process payments via Square's Payments API with server-side communication. Transition orders from DRAFT → OPEN → COMPLETED atomically in a single Server Action at payment submission.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: Next.js 16.x (App Router), React 19.x (RSC), Square SDK (2025-01), Square Web Payments SDK (client-side tokenization), Clerk (auth), Zod (validation), Tailwind CSS 4, shadcn/ui (base-nova), CVA 0.7, Lucide React

**Storage**: N/A — Square API is the data source

**Testing**: Vitest + @testing-library/react + MSW (unit/integration), Playwright (E2E)

**Target Platform**: Vercel (Pro); local dev via `vercel dev`

**Project Type**: Web application — Next.js Server Components + Client Components

**Performance Goals**: Checkout page load <3s; payment submission to confirmation <5s

**Constraints**: Card numbers never reach the server (tokenized client-side via Square Web Payments SDK); all Square API calls through Route Handlers or Server Actions; idempotency keys on all mutations

**Scale/Scope**: Single store, single payment processor (Square), credit cards only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | **Server Components First** | ✅ PASS | Checkout page is an async Server Component. Data fetching (order, loyalty, customer profile) happens server-side. Payment form is a `"use client"` leaf component for Square Web Payments SDK initialization. |
| II | **API Route Security** | ✅ PASS | Card tokenization happens client-side via Square's JavaScript library (card numbers never touch our server). Payment processing flows through a Server Action or Route Handler — Square access token stays server-side. |
| III | **Type-Safe Data Flow** | ✅ PASS | New Zod schemas for payment form input validation. Payment response types in `lib/square/types.ts`. All imports use `@/*` alias. |
| IV | **Vercel-Native Performance** | ✅ PASS | Checkout page uses `<Suspense>` boundaries with per-section skeleton placeholders. Payment processing is a single Server Action call (no redirect to external page). |
| V | **Progressive Enhancement** | ⚠️ PARTIAL | Payment requires JavaScript (Square Web Payments SDK). Without JS, the checkout page shows the order summary but the payment form is non-functional. Acceptable — online card payments inherently require JS. |
| VI | **Gherkin-First Testing** | ✅ PASS | `.feature` file exists at `specs/028-custom-checkout/features/custom-checkout.feature` with 16 scenarios. |
| VII | **Environment-Driven Configuration** | ✅ PASS | `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_APPLICATION_ID` already validated in `lib/env.ts`. Square Web Payments SDK uses `SQUARE_APPLICATION_ID` (public, safe for client). No new env vars. |

**Post-Design Re-check**: Will re-evaluate after Phase 1.

## Project Structure

### Documentation (this feature)

```text
specs/028-custom-checkout/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── checkout-api.md
├── features/
│   └── custom-checkout.feature
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── checkout/
│   └── page.tsx                  # NEW: async Server Component — checkout page
├── order/
│   └── confirmation/
│       └── page.tsx              # NEW: order confirmation page (replaces /order/result)
├── cart/
│   ├── page.tsx                  # MODIFIED: "Proceed to Checkout" links to /checkout
│   ├── actions.ts                # MODIFIED: remove initiateCheckout, add processPayment
│   └── cart-client.tsx           # MODIFIED: update checkout button target
├── api/
│   └── payments/
│       └── route.ts              # NEW: POST /api/payments — process card payment

components/
├── checkout/
│   ├── checkout-page-client.tsx  # NEW: "use client" wrapper — composes all sections
│   ├── order-summary.tsx         # NEW: displays items, subtotal, reward discount, total
│   ├── customer-info.tsx         # NEW: displays pre-populated name/email
│   ├── payment-form.tsx          # NEW: "use client" — Square Web Payments SDK + billing address
│   ├── reward-discount.tsx       # NEW: reward discount line item
│   └── checkout-skeleton.tsx     # NEW: skeleton placeholder

lib/
├── square/
│   ├── types.ts                  # MODIFIED: add PaymentFormInput, PaymentResult, CheckoutData
│   └── payments.ts               # NEW: processCardPayment, createPayment functions
```

**Structure Decision**: New `/checkout` route page. Payment form uses `"use client"` for Square Web Payments SDK. Confirmation page at `/order/confirmation`. Existing payment link code (`createPaymentLink`, `initiateCheckout`) removed.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Constitution V (progressive enhancement) — payment requires JS | Square Web Payments SDK is JavaScript-only; card tokenization cannot happen without JS. All online card payment flows require JS. | Server-side card processing would expose raw card numbers to our server, increasing PCI compliance scope dramatically. |
