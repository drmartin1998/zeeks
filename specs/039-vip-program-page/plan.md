# Implementation Plan: VIP Program Page

**Branch**: `039-vip-program-page` | **Date**: 2026-08-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/039-vip-program-page/spec.md`

## Summary

Add a public VIP Program page (`/vip-program`) reachable from a "VIP Program" link in the global navigation. The page lists the two purchasable VIP subscription tiers ("VIP Basic" and "VIP Premium") retrieved live from the Square catalog as `SUBSCRIPTION_PLAN` objects, each shown with its name, price, and benefits. Each tier has a purchase action that routes through the existing custom web-checkout flow using a saved card (card-on-file) to create the subscription in Square. The page also presents the program's informational content (hero, tier comparison, VIP Weekends, FAQ) matching the Figma `vip-program-page` design.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: Next.js 16.x (App Router), React 19.x (RSC), Square SDK (2025-01), Clerk (auth), Zod (validation), Tailwind CSS 4, shadcn/ui (base-nova), CVA 0.7, Lucide React

**Storage**: N/A — Square API is the data source (subscription plans live in the Square catalog)

**Testing**: Vitest + @testing-library/react + MSW (unit/integration), Playwright (E2E)

**Target Platform**: Vercel (Pro); local dev via `vercel dev`

**Project Type**: Web application — Next.js Server Components + Client Components

**Performance Goals**: VIP page load <3s; tier data rendered from server-side Square fetch

**Constraints**: Square access token NEVER exposed to the browser (Constitution II); all Square calls through Route Handlers or Server Actions; no mock/hardcoded subscription data in production (show error/empty states); `@/*` imports only

**Scale/Scope**: Single store; two VIP tiers; public informational page with authenticated purchase action

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | **Server Components First** | ✅ PASS | VIP page is an async Server Component that fetches subscription plans server-side from Square. Purchase action routes to the existing checkout flow (Server Action). Any interactive leaf (e.g., FAQ accordion) is a `"use client"` leaf node. |
| II | **API Route Security** | ✅ PASS | Subscription plan data fetched server-side via Square SDK; token stays server-side. Purchase reuses existing checkout Server Action / Route Handler. |
| III | **Type-Safe Data Flow** | ✅ PASS | New Zod schemas + interfaces for subscription plan data in `lib/square/types.ts`. All imports use `@/*` alias. |
| IV | **Vercel-Native Performance** | ✅ PASS | Static/marketing sections render server-side; subscription plan fetch cached appropriately; page uses `<Suspense>` where async. |
| V | **Progressive Enhancement** | ✅ PASS | Page content (tiers, benefits, FAQ) renders as static HTML from server data; navigation uses `<Link>`; purchase is an enhancement layered on the baseline. |
| VI | **Gherkin-First Testing** | ✅ PASS | `.feature` file exists at `specs/039-vip-program-page/features/vip-program-page.feature` with 9 scenarios. |
| VII | **Environment-Driven Configuration** | ✅ PASS | Reuses existing `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`; no new required env vars. |

**Post-Design Re-check**: ✅ Re-evaluated after Phase 1 — all 7 principles remain PASS. The design keeps the VIP page as an async Server Component (I), fetches subscription plans server-side via the Square SDK (II), adds typed Zod-validated interfaces for plans (III), caches the catalog fetch (IV), renders static HTML with `<Link>` navigation (V), is backed by the `.feature` file (VI), and reuses existing validated env vars (VII).

## Project Structure

### Documentation (this feature)

```text
specs/039-vip-program-page/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── vip-program-api.md
├── features/
│   └── vip-program-page.feature
└── spec.md
```

### Source Code (repository root)

```text
app/
└── vip-program/
    └── page.tsx              # Public VIP Program page (async RSC)

components/
└── vip-program/
    ├── vip-hero.tsx          # Hero section (design copy)
    ├── tier-comparison.tsx   # Renders the two subscription tiers
    ├── vip-weekends.tsx      # VIP Weekends benefits section
    └── vip-faq.tsx           # FAQ section (accordion)

lib/
└── square/
    ├── subscriptions.ts      # Fetch SUBSCRIPTION_PLAN catalog objects
    └── types.ts              # Add VipSubscriptionPlan types + Zod schema

lib/
└── data/
    └── categories.ts         # Add "VIP Program" to STATIC_NAV_CATEGORIES

app/api/
└── vip/
    └── subscriptions/
        └── route.ts          # GET subscription plans (if client fetch needed)

__tests__/ (co-located)       # Unit + integration tests
tests/e2e/                    # Critical journey E2E
```

**Structure Decision**: Single Next.js project. The VIP page follows the existing `app/about` (static RSC) and `app/account` (data-driven RSC) patterns. Subscription plan data is fetched server-side via a new `lib/square/subscriptions.ts` module using the existing `catalogApi.search({ objectTypes: ["SUBSCRIPTION_PLAN"] })` pattern. Purchase reuses the existing checkout flow.

## Complexity Tracking

> No Constitution Check violations. Table intentionally left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
