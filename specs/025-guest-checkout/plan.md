# Implementation Plan: Guest Cart & Checkout

**Branch**: `025-guest-checkout` | **Date**: 2026-08-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/025-guest-checkout/spec.md`

## Summary

Add a guest checkout path alongside the existing authenticated flow. Allow unauthenticated visitors to build a cart, initiate checkout, and complete payment — without creating an account. Reuse the existing Square Orders and Payment Links infrastructure through guest-aware function overloads that accept a cookie-stored `orderId` instead of requiring a `squareCustomerId`.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: Next.js 16.x (App Router), React 19.x (RSC), Clerk (auth — existing path unchanged), Square SDK 45.x, Tailwind CSS 4.x, shadcn/ui (base-nova)

**Storage**: Square Orders API (server-side for both auth and guest orders), browser cookies (guest cart order ID), Clerk privateMetadata (Square customer ID — auth path only)

**Testing**: Vitest + RTL + user-event (integration), MSW (network mocking), Playwright (E2E)

**Target Platform**: Web (Vercel deployment)

**Project Type**: Web application (Next.js App Router)

**Performance Goals**: Guest checkout redirect under 5 seconds (same as SC-001 from 024); guest cart operations comparable to authenticated path

**Constraints**: Server Components First (RSC); Square credentials NEVER exposed to browser; no mock data in production; Gherkin-first testing; existing authenticated flow MUST NOT regress

**Scale/Scope**: Additive feature — 7 files modified, 1 new cookie mechanism, 0 new API routes; guest path is a parallel track, not a rewrite

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | ✅ PASS | Cart page already RSC; guest checkout action uses Server Action (same as auth). No new "use client" beyond existing CartSummary/CartClient leaf components. |
| II | API Route Security | ✅ PASS | Guest checkout reuses same server actions — auth gate becomes conditional (guest OR authenticated), not removed. Square token stays server-side. Payment link still generated server-side. |
| III | Type-Safe Data Flow | ✅ PASS | New types for GuestCartIdentifier, updated CheckoutInput with optional squareCustomerId. Zod validation updated. `@/*` imports only. |
| IV | Vercel-Native Performance | ✅ PASS | Cart page already streams with Suspense. No new client bundle (cookie set server-side). Guest path adds no additional round trips. |
| V | Progressive Enhancement | ✅ PASS | Guest checkout uses same `formAction` on `<form>` — works without JS. Cart operations remain server actions. |
| VI | Gherkin-First Testing | ✅ PASS | `.feature` file exists at `specs/025-guest-checkout/features/guest-checkout.feature` with 11 scenarios. Integration tests will validate against Gherkin acceptance criteria. |
| VII | Environment-Driven Configuration | ✅ PASS | Guest cart uses cookies (no new env vars). Existing `squareClient` reused. No new environment dependencies. |

**Gate Result**: ALL PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/025-guest-checkout/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── cart/
│   ├── page.tsx          # MODIFY: remove hard auth redirect; add guest path
│   ├── actions.ts        # MODIFY: guest-aware cart actions (conditional auth gate)
│   └── __tests__/        # ADD: guest checkout integration tests

lib/square/
├── cart.ts              # MODIFY: add guest-aware overloads (orderId param)
├── checkout.ts          # MODIFY: createPaymentLink accepts optional orderId
├── types.ts             # MODIFY: CheckoutInput.squareCustomerId → optional; add guest types
└── cookies.ts           # NEW: guest cart cookie helpers (set/get/clear)

components/cart/
├── cart-client.tsx       # MODIFY: squareCustomerId nullable
├── cart-summary.tsx      # MODIFY: pass guest identifier instead of squareCustomerId

components/
└── nav-bar.tsx           # MODIFY: cart badge reads guest cookie for count (FR-015)

middleware.ts             # NO CHANGE (already permissive)
app/order/result/        # NO CHANGE (already auth-free)
```

**Structure Decision**: Single Next.js App Router project. Guest checkout is additive — modifies existing files with guest-aware paths. No new pages or API routes. Cookie helper extracted to `lib/square/cookies.ts` to keep cart/checkout logic clean.

## Complexity Tracking

> No violations. No entries needed.
