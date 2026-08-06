# Implementation Plan: Guest Loyalty Prompt on Checkout

**Branch**: `029-guest-loyalty-prompt` | **Date**: 2026-08-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/029-guest-loyalty-prompt/spec.md`

## Summary

Add a non-blocking loyalty incentive notification to the custom checkout page for unauthenticated (guest) visitors. The notification informs guests they can register or sign in to earn loyalty points and redeem existing rewards. It includes "Register" and "Sign In" call-to-action buttons with `return_to=/checkout` query parameters, is dismissible per browser session, and is announced to screen readers via `role="status"`. The notification never appears for authenticated customers or when the loyalty program is not configured/unreachable. This is a purely additive UI layer — all underlying guest checkout, loyalty, and auth mechanisms already exist.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: Next.js 16.x (App Router), React 19.x (RSC), Clerk (auth), Square SDK 2025-01, Tailwind CSS 4, shadcn/ui (base-nova), Lucide React, Zod

**Storage**: N/A — notification dismissal state uses browser `sessionStorage` only

**Testing**: Vitest + @testing-library/react + MSW (unit/integration), Playwright (E2E)

**Target Platform**: Vercel (Pro); local dev via `vercel dev`

**Project Type**: Web application — Next.js Server Components + Client Components

**Performance Goals**: Notification must not delay checkout page render (FR-007); no additional API latency beyond existing checkout page load

**Constraints**: Server Components First — notification visibility is determined server-side; `"use client"` only for the dismiss button interaction; all Square API calls through existing `lib/square/` modules; `@/*` imports only

**Scale/Scope**: Single store, ~10k users. Additive UI layer only — no new API routes, no new Square API calls.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | **Server Components First** | ✅ PASS | Notification is an RSC (`GuestLoyaltyNotification`). Returns `null` server-side when conditions aren't met (auth state, loyalty config, API health). Dismiss button is a `"use client"` leaf node. |
| II | **API Route Security** | ✅ PASS | No new API routes. Loyalty API availability check reuses `isLoyaltyConfigured()` from `lib/square/loyalty.ts`. Square credentials never leave the server. |
| III | **Type-Safe Data Flow** | ✅ PASS | No new Square API types needed. Notification props use existing `boolean` types. All imports use `@/*` alias. |
| IV | **Vercel-Native Performance** | ✅ PASS | Notification is determined server-side and rendered in initial HTML (no hydration flicker). Does not add a new Suspense boundary — inline within existing checkout page render. No additional data fetching beyond what checkout already does. |
| V | **Progressive Enhancement** | ⚠️ PARTIAL | Dismiss button requires JavaScript to update `sessionStorage`. Without JS, the notification remains visible (non-blocking, so acceptable). Register/Sign In links are standard `<a>` tags — functional without JS. |
| VI | **Gherkin-First Testing** | ✅ PASS | `.feature` file exists at `specs/029-guest-loyalty-prompt/features/guest-loyalty-prompt.feature` with 11 scenarios. |
| VII | **Environment-Driven Configuration** | ✅ PASS | `SQUARE_LOYALTY_PROGRAM_ID` already validated in `lib/env.ts` as optional. Notification uses `isLoyaltyConfigured()` which reads this env var. No new env vars. |

**Post-Design Re-check**: All 7 principles remain as assessed pre-design. No violations surfaced during research, data modeling, or contract definition. The Progressive Enhancement partial (V) remains: dismiss button requires JavaScript for `sessionStorage`, but the notification is non-blocking and Register/Sign In links work without JS. This is the same justification as the pre-design check — acceptable for an enhancement on top of the core checkout flow.

## Project Structure

### Documentation (this feature)

```text
specs/029-guest-loyalty-prompt/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── notification-api.md
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root) — Files Touched

```text
app/checkout/page.tsx                              # MODIFY: Allow guest access, pass isGuest prop
components/checkout/checkout-page-client.tsx       # MODIFY: Accept & render GuestLoyaltyNotification
components/checkout/guest-loyalty-notification.tsx # NEW: RSC — visibility logic, returns null or banner
components/checkout/__tests__/
  guest-loyalty-notification.test.tsx              # NEW: Integration tests
```

### Source Code (not touched but relevant)

```text
app/sign-in/page.tsx                               # Existing: AuthGuard + SignInForm (needs return_to support)
app/sign-up/page.tsx                               # Existing: AuthGuard + SignUpForm (needs return_to support)
lib/square/loyalty.ts                              # Existing: isLoyaltyConfigured(), loyalty API calls
lib/square/cart.ts                                 # Existing: guest cart via cookie-based orderId
app/cart/actions.ts                                # Existing: processPayment Server Action (guest path)
components/cart/earned-points-notice.tsx           # Reference: similar RSC pattern for loyalty display
```

### Source Code Structure Decision

Next.js App Router single-project structure. New component placed in `components/checkout/` alongside existing checkout components (`checkout-page-client.tsx`, `order-summary.tsx`, `customer-info.tsx`, `payment-form.tsx`, `checkout-skeleton.tsx`). Tests co-located in `__tests__/`.

## Complexity Tracking

> No violations. All Constitution principles pass or have justified partial compliance.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| V: Dismiss button JS dependency | `sessionStorage` is the session-scoped storage mechanism per spec Assumptions | Server-side session storage would require a database write for a non-critical UI toggle; cookie-based approach would require HTTP response headers on every page load. `sessionStorage` is the lightest touch that meets the requirement. |
