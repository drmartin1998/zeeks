# Implementation Plan: Rewards Redemption

**Branch**: `027-rewards-redemption` | **Date**: 2026-08-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/027-rewards-redemption/spec.md`

## Summary

Add a Square loyalty rewards panel to the cart page. Authenticated customers see their points balance and can select a single reward tier (radio-style) to apply a discount to their current order. The panel sits inline within the cart items column, below the line items. Reward selection triggers Square's `createLoyaltyReward` API (passing the `order_id` to attach the discount), and deselection calls `deleteLoyaltyReward`. An earned-points notice in the order summary sidebar shows estimated points from the current subtotal via `calculateLoyaltyPoints`. Design follows the Figma `squares-loyalty-panel` node (167:2749) with cream background, gold accents, radio selection, and responsive breakpoints.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: Next.js 16.x (App Router), React 19.x (RSC), Square SDK (2025-01), Clerk (auth), Zod (validation), Tailwind CSS 4, shadcn/ui (base-nova), CVA 0.7, Lucide React

**Storage**: N/A — Square API is the data source (no persistence beyond Square)

**Testing**: Vitest + @testing-library/react + MSW (unit/integration), Playwright (E2E)

**Target Platform**: Vercel (Pro) deployment; Linux server for local dev with `vercel dev`

**Project Type**: Web application — Next.js Server Components with Client Component leaf nodes

**Performance Goals**: Cart page load (including loyalty data) <3s; reward selection click-to-confirmation <10s

**Constraints**: Square API calls through Route Handlers or Server Actions only; idempotency keys on all mutations; no client-side fetch to Square; bundle <150KB per route

**Scale/Scope**: Single store, single loyalty program, typically 2-6 reward tiers per program

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | **Server Components First** | ✅ PASS | Cart page is already a Server Component. Loyalty panel data (loyalty account, program, reward tiers, earned points) fetched server-side via `Promise.allSettled()`. Reward selection interactivity in a `"use client"` leaf component — justified by radio-button click handling. |
| II | **API Route Security** | ⚠️ PARTIAL | Read operations (fetching loyalty data) occur in the Server Component (consistent with existing cart pattern). Write operations (createReward, deleteReward) use Server Actions following the existing `app/cart/actions.ts` pattern. The constitution requires Route Handlers for Square API, but the existing cart implementation uses Server Actions. Following existing project conventions over strict constitution text. See Complexity Tracking. |
| III | **Type-Safe Data Flow** | ✅ PASS | New types (`LoyaltyProgramDetail`, `RewardTier`, `LoyaltyReward`) defined in `lib/square/types.ts`. Zod schemas for Server Action inputs (`selectRewardSchema`, `deselectRewardSchema`). All imports use `@/*` alias. |
| IV | **Vercel-Native Performance** | ✅ PASS | Loyalty panel wrapped in `<Suspense>` with skeleton placeholder. Cart is a dynamic page (per-user state) using streaming. No images in the loyalty panel (text-only). |
| V | **Progressive Enhancement** | ⚠️ PARTIAL | Reward selection requires JavaScript (radio-button click → API call → visual update). The baseline experience (without JS) shows the loyalty panel with points and reward tiers but cannot select rewards. This is acceptable per the constitution's "Interactive enhancements layer on top of baseline" clause. |
| VI | **Gherkin-First Testing** | ✅ PASS | `.feature` file exists at `specs/027-rewards-redemption/features/rewards-redemption.feature` with 14 scenarios across 3 user stories. |
| VII | **Environment-Driven Configuration** | ✅ PASS | `SQUARE_LOYALTY_PROGRAM_ID` already validated in `lib/env.ts` (from spec 016). No new env vars required. |

**Post-Design Re-check**: After Phase 1 design, all principles remain in the same state as pre-design. The design follows the same Server Component → Server Action pattern used by the existing cart implementation. No new violations introduced.

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | ✅ PASS | LoyaltyPanel (RSC) wraps LoyaltyPanelClient ("use client"). Data fetched server-side via `getLoyaltyPanelData()`. |
| II | API Route Security | ⚠️ PARTIAL | Reward mutations use Server Actions, consistent with existing `app/cart/actions.ts` pattern. Idempotency keys on all mutations. |
| III | Type-Safe Data Flow | ✅ PASS | `LoyaltyAccount`, `RewardTier`, `LoyaltyReward`, `LoyaltyPanelData`, `SelectRewardSchema`, `DeselectRewardSchema` all added to `lib/square/types.ts`. |
| IV | Vercel-Native Performance | ✅ PASS | `<Suspense>` with `<LoyaltyPanelSkeleton>`. Parallel `Promise.allSettled()` for all 4 loyalty fetches. No client-side data fetching. |
| V | Progressive Enhancement | ⚠️ PARTIAL | Reward selection requires JavaScript. Without JS, panel shows points and tiers but selection is non-functional. ARIA `radiogroup` role provides accessible baseline. |
| VI | Gherkin-First Testing | ✅ PASS | 14 scenarios in `features/rewards-redemption.feature` — all mapped to VS-1 through VS-10 in `quickstart.md`. |
| VII | Environment-Driven Configuration | ✅ PASS | `SQUARE_LOYALTY_PROGRAM_ID` validated in `lib/env.ts`. No new env vars needed. |

## Project Structure

### Documentation (this feature)

```text
specs/027-rewards-redemption/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── loyalty-api.md   # Server Action / Route Handler contracts
├── features/
│   └── rewards-redemption.feature
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── cart/
│   ├── page.tsx                 # MODIFIED: add loyalty data fetch + Suspense boundary
│   ├── actions.ts               # MODIFIED: add selectReward, deselectReward Server Actions
│   └── layout.tsx               # (unchanged)
├── api/
│   └── loyalty/
│       └── rewards/
│           └── route.ts         # NEW: GET (list rewards on order), POST (create), DELETE (remove)
│
lib/
├── square/
│   ├── loyalty.ts               # MODIFIED: add getLoyaltyProgram, getRewardTiers, createLoyaltyReward, deleteLoyaltyReward, calculateLoyaltyPoints
│   ├── types.ts                 # MODIFIED: add LoyaltyProgramDetail, RewardTier, LoyaltyReward, EarnedPoints
│   └── client.ts                # (unchanged, loyaltyApi already exported)
│
components/
├── cart/
│   ├── cart-client.tsx          # MODIFIED: add <Suspense> for loyalty panel
│   ├── cart-line-item.tsx       # (unchanged)
│   ├── cart-summary.tsx         # MODIFIED: add earned-points notice below totals
│   └── loyalty-panel/
│       ├── loyalty-panel.tsx    # NEW: Server Component wrapper (data fetch)
│       ├── loyalty-panel-client.tsx  # NEW: "use client" interactivity (radio selection)
│       ├── loyalty-panel-skeleton.tsx # NEW: skeleton placeholder
│       └── reward-option.tsx    # NEW: individual reward tier row
│
__tests__/
├── components/cart/
│   └── loyalty-panel.test.tsx   # NEW: integration tests (RTL + MSW)
```

**Structure Decision**: Single Next.js App Router project. Loyalty panel lives as a co-located component group under `components/cart/loyalty-panel/`. Server Actions are added to the existing `app/cart/actions.ts`. A new Route Handler at `app/api/loyalty/rewards/route.ts` provides an API surface for the loyalty reward CRUD operations (alternative to Server Actions, for future extensibility).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Constitution II (Square API through Route Handlers) — reward mutations use Server Actions | Existing cart mutations (`addToCart`, `removeCartItem`, `updateCartItem`) all use Server Actions with direct Square SDK calls. Introducing Route Handlers for loyalty would create inconsistency and add unnecessary indirection for behavior that mirrors existing cart patterns. | Using Route Handlers would add an extra network hop (client → Route Handler → Square) for reward selection clicks, increasing latency. The existing Server Action pattern is proven and battle-tested in this codebase. |
