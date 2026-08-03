# Implementation Plan: Square Checkout Flow

**Branch**: `024-checkout-flow` | **Date**: 2026-08-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/024-checkout-flow/spec.md`

## Summary

Wire the dead "Proceed to Checkout" button on the cart page to Square's Payment Links API. When clicked, convert the customer's Square draft order to a pending order, generate a Square-hosted payment link, and redirect the customer to complete payment. Add order confirmation and cancellation pages for post-payment return.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: Next.js 16.x (App Router), React 19.x (RSC), Clerk (auth), Square SDK 45.x, Tailwind CSS 4.x, shadcn/ui (base-nova)

**Storage**: Square Orders API (server-side), Clerk privateMetadata (Square customer ID)

**Testing**: Vitest + RTL + user-event (integration), MSW (network mocking), Playwright (E2E)

**Target Platform**: Web (Vercel deployment)

**Project Type**: Web application (Next.js App Router)

**Performance Goals**: Checkout redirect within 5 seconds (SC-001); confirmation page renders in under 3 seconds (SC-004)

**Constraints**: Server Components First (RSC); Square credentials NEVER exposed to browser; no mock data in production; Gherkin-first testing

**Scale/Scope**: Single checkout flow; 3 new/existing pages (cart wire, confirmation, cancellation); 1 new API route; 2 new Square client exports

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | ✅ PASS | Cart page already RSC; checkout action uses Server Action; confirmation/cancellation pages will be RSC. No new "use client" except CartSummary button wiring (leaf node — allowed). |
| II | API Route Security | ✅ PASS | Checkout action is a Server Action (auth gate + Zod validation before Square API). Square token stays server-side. Payment link generated server-side. |
| III | Type-Safe Data Flow | ✅ PASS | New types for CheckoutInput/CheckoutResult/PaymentLink in `lib/square/types.ts`. Zod validation on checkout action input. `@/*` imports only. |
| IV | Vercel-Native Performance | ✅ PASS | Cart page streams with Suspense (existing pattern). Confirmation pages static-after-dynamic. No new client bundle (redirect is server-side response). |
| V | Progressive Enhancement | ✅ PASS | Checkout uses `formAction` on a `<form>` with native submission. Redirect is HTTP 303 server-side. Works without JS. |
| VI | Gherkin-First Testing | ✅ PASS | `.feature` file exists at `specs/024-checkout-flow/features/checkout-flow.feature` with 6 scenarios. Integration tests will validate against Gherkin acceptance criteria. |
| VII | Environment-Driven Configuration | ✅ PASS | All new Route Handlers reuse existing `squareClient` (already validated at startup via `lib/env.ts`). `SQUARE_ACCESS_TOKEN`, `SQUARE_APPLICATION_ID` already validated. |

**Gate Result**: ALL PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/024-checkout-flow/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
lib/square/
├── client.ts            # ADD: export checkoutApi
├── types.ts             # ADD: CheckoutInput, CheckoutResult, PaymentLink types
└── checkout.ts          # NEW: checkout server logic (create payment link, convert order)

app/
├── cart/
│   └── actions.ts       # ADD: initiateCheckout server action
├── order/               # NEW
│   └── result/
│       └── page.tsx      # Single return page (reads ?status= param for confirmation/cancellation views)

components/
└── cart/
    └── cart-summary.tsx  # MODIFY: wire Checkout button, disable when unavailable
```

**Structure Decision**: This is a single Next.js App Router project. New files follow existing patterns: server actions in `app/cart/actions.ts`, Square logic in `lib/square/`, types in `lib/square/types.ts`, pages are RSC in `app/` directory.

## Complexity Tracking

> No violations. No entries needed.
