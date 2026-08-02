# Implementation Plan: Customer Account Dashboard

**Branch**: `015-customer-account-dashboard` | **Date**: 2026-08-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-customer-account-dashboard/spec.md`

## Summary

Create a protected account dashboard at `app/account/page.tsx` as an async Server Component. The page uses Clerk `auth()` to retrieve the logged-in user's `squareCustomerId` from session metadata, then performs three parallel Square API fetches via `Promise.allSettled()`: customer profile, loyalty balance, and order history. Each section renders independently using existing shadcn/ui components (Card, Table, Badge) with graceful empty states and error states. A new `middleware.ts` protects the `/account` route.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Next.js 16.2.10, React 19.2.4

**Primary Dependencies**: `@clerk/nextjs` v7 (existing), Square SDK v45 (existing), shadcn/ui (existing), Lucide React (existing)

**Storage**: N/A — all data is live-fetched from Square APIs. Clerk session stores `squareCustomerId` in `privateMetadata`.

**Testing**: Vitest + @testing-library/react + MSW (integration), Vitest (unit). Following Testing Trophy: integration > unit.

**Target Platform**: Vercel (Next.js App Router), modern browsers

**Project Type**: Web application (Next.js eCommerce frontend)

**Performance Goals**: Dashboard renders all three sections within 3 seconds (SC-001); each section degrades independently without blocking others (SC-002).

**Constraints**: Server Component only — no `"use client"` for the page itself (Constitution I). All Square API calls server-side only. `@/*` imports only. No mock data in production.

**Scale/Scope**: One new page (`app/account/page.tsx`), one new middleware file, one new data-fetching module (`lib/square/dashboard.ts`), new type definitions. 3 user stories, 12 functional requirements, 14 Gherkin scenarios.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | ✅ PASS | Page is an async Server Component. Data fetching via direct Square SDK calls (not Route Handlers — pattern established in `lib/square/catalog.ts`). No `"use client"` on the page itself. |
| II | API Route Security | ✅ PASS | Square SDK calls happen server-side in the RSC. Square access token is server-only via `lib/env.ts`. Clerk `auth()` is server-side. No tokens exposed to browser. |
| III | Type-Safe Data Flow | ✅ PASS | New interfaces for CustomerProfile, LoyaltyAccount, and OrderSummary in `lib/square/types.ts`. Zod schemas optionally for Square response shape validation. `@/*` imports only. TypeScript strict mode. |
| IV | Vercel-Native Performance | ✅ PASS | Parallel data fetching with `Promise.allSettled()` avoids waterfall. `<Suspense>` boundaries for each section with skeleton fallbacks for perceived performance. No ISR needed (per-user, real-time data). |
| V | Progressive Enhancement | ⚠️ MINOR | Dashboard requires JavaScript for Clerk auth session — inherent to any authenticated page. The core shopping flow (browse → view product) remains JS-optional. No forms or mutations on this page. |
| VI | Gherkin-First Testing (Testing Trophy) | ✅ PASS | 14 Gherkin scenarios in `.feature` file. Integration tests (RTL + MSW) for the page component. Unit tests for data transforms and type schemas. |
| VII | No Mock Data Fallback | ✅ PASS | All data fetched live from Square APIs. Error states shown on failure — no fallback mock data. Empty states rendered when Square returns no data (legitimate state). |

**Gate Result**: PASS — all 7 principles satisfied. One minor note on Principle V (JS dependency for auth) — inherent to any authenticated page.

## Project Structure

### Documentation (this feature)

```text
specs/015-customer-account-dashboard/
├── plan.md              # This file
├── spec.md              # Feature specification
├── features/
│   └── customer-account-dashboard.feature  # Gherkin scenarios
├── checklists/
│   └── requirements.md  # Quality checklist (to be created)
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (files to create/modify)

```text
app/
├── account/
│   ├── page.tsx                       # NEW — async RSC dashboard page
│   └── __tests__/
│       └── page.test.tsx              # NEW — integration tests
├── layout.tsx                         # (unchanged — ClerkProvider already wraps root)
└── globals.css                        # (unchanged)

middleware.ts                          # NEW — Clerk middleware protecting /account

lib/square/
├── dashboard.ts                       # NEW — parallel data-fetching helpers
├── __tests__/
│   └── dashboard.test.ts              # NEW — unit tests for fetch helpers
├── client.ts                          # MODIFY — export loyaltyApi, ordersApi
└── types.ts                           # MODIFY — add dashboard-related interfaces

components/
├── account/
│   ├── points-card.tsx                # NEW — loyalty points display card
│   ├── profile-card.tsx               # NEW — customer profile info card
│   ├── orders-table.tsx               # NEW — order history table
│   ├── account-skeleton.tsx           # NEW — loading skeleton for dashboard
│   └── __tests__/
│       ├── points-card.test.tsx       # NEW
│       ├── profile-card.test.tsx      # NEW
│       └── orders-table.test.tsx      # NEW
```

**Structure Decision**: The page at `app/account/page.tsx` is the single entry point. Data fetching is extracted to `lib/square/dashboard.ts` following the existing pattern (`lib/square/catalog.ts`, `lib/square/customers.ts`). Three leaf components (`points-card`, `profile-card`, `orders-table`) are server components that receive pre-fetched data as props. A skeleton component provides loading states for `<Suspense>` boundaries.

## Complexity Tracking

> No constitution violations requiring justification.

## Data Flow

```
Clerk auth() → sessionClaims.privateMetadata.squareCustomerId
    │
    ├── (missing) → render syncing state, no API calls
    │
    └── (present) → Promise.allSettled([
            customersApi.retrieveCustomer(id),
            loyaltyApi.searchLoyaltyAccounts({ query: { customerIds: [id] } }),
            ordersApi.searchOrders({ query: { filter: { customerFilter: { customerIds: [id] } } } })
        ])
            │
            ├── ProfileResult  → ProfileCard (or error state)
            ├── LoyaltyResult  → PointsCard (or empty/error state)
            └── OrdersResult   → OrdersTable (or empty/error state)
```

## API Reference

| API | Method | Parameters |
|-----|--------|------------|
| `customersApi.retrieveCustomer` | GET | `customerId: string` |
| `loyaltyApi.searchLoyaltyAccounts` | POST | `query.customerIds: string[]` |
| `ordersApi.searchOrders` | POST | `query.filter.customerFilter.customerIds: string[]`, `query.sort.sortField: "CLOSED_AT"`, `query.sort.sortOrder: "DESC"`, `limit: 10` |
