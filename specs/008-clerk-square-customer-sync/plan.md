# Implementation Plan: Clerk-to-Square Customer Sync

**Branch**: `008-clerk-square-customer-sync` | **Date**: 2026-08-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-clerk-square-customer-sync/spec.md`

## Summary

Extend the existing Clerk webhook handler at `app/api/webhooks/clerk/route.ts` to process `user.created` events. When a new user registers, the handler extracts their email and name, searches for an existing Square customer by email, creates one if not found, then saves the Square customer ID back to the Clerk user's private metadata. Includes exponential backoff retry for rate-limited or timed-out Square API calls, idempotency via Clerk metadata check, and comprehensive error logging.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: Next.js 16 (App Router), Square SDK v45, Svix v1.99.1, `@clerk/backend` (new — for user metadata read/update), Zod (for env validation)

**Storage**: N/A — no persistent database; Clerk private metadata stores the Square customer ID, Square API stores customer records.

**Testing**: Vitest + @testing-library/react + MSW (integration), Vitest (unit). Following Testing Trophy: integration > unit.

**Target Platform**: Vercel serverless functions (Next.js Route Handler)

**Project Type**: Web application (Next.js App Router backend)

**Performance Goals**: Each webhook processed within 5 seconds total; individual Square API calls within 3 seconds each; support ≤20 concurrent, ≤100/day.

**Constraints**: All Square API calls server-side via Route Handlers; secrets never exposed to browser; Zod validation for all external inputs; `@/*` path alias for imports; no mock data in production.

**Scale/Scope**: Single Route Handler modification, ≤100 registrations/day, 3 user stories, 11 functional requirements, 9 Gherkin scenarios.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | ✅ PASS | Webhook handler is a Route Handler — server-side only. No client components involved. |
| II | API Route Security | ✅ PASS | Square API calls flow through the Route Handler (`app/api/webhooks/clerk/route.ts`). Square token and Clerk secret are server-only environment variables. Zod validation for env vars via `@/lib/env`. |
| III | Type-Safe Data Flow | ✅ PASS | Webhook payload validated with Zod before Square operations. Typed interfaces for Clerk event payload and Square customer responses. Clerk metadata key (`squareCustomerId`) is a typed constant. `@/*` imports only. |
| IV | Component Architecture | ✅ PASS | No UI components involved — pure backend feature. |
| V | Performance & Caching | ✅ PASS | Idempotency via Clerk metadata check (no redundant Square calls). Retry with exponential backoff for transient failures. No caching needed (webhook processing is one-shot). |
| VI | Gherkin-First Testing (Testing Trophy) | ✅ PASS | 9 Gherkin scenarios in `.feature` file. Integration tests (RTL + MSW) for the Route Handler. Unit tests for utility functions (email extraction, retry logic). |
| VII | No Mock Data Fallback | ✅ PASS | Square API is the sole source of customer data. No mock/fallback customer data in production code. Error states logged and returned as HTTP status codes, not substituted data. |

**Constitution Check Result**: ALL PASS. No violations or exceptions required.

## Project Structure

### Documentation (this feature)

```text
specs/008-clerk-square-customer-sync/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── features/
│   └── clerk-to-square-customer-sync.feature  # Gherkin scenarios
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
app/api/webhooks/clerk/
├── route.ts                          # MODIFY — add user.created handling
└── __tests__/
    └── route.test.ts                 # MODIFY — add customer sync test cases

lib/square/
├── client.ts                         # MODIFY — export customers API
├── customers.ts                      # NEW — Square customer lookup/create helpers
├── __tests__/
│   └── customers.test.ts             # NEW — unit tests for customer helpers
├── types.ts                          # MODIFY — add Square customer types
└── env.ts                            # MODIFY — add CLERK_SECRET_KEY validation

lib/webhooks/
├── clerk.ts                          # NEW — Clerk SDK client initialization
├── retry.ts                          # NEW — exponential backoff retry utility
└── __tests__/
    ├── clerk.test.ts                 # NEW — unit tests for Clerk helpers
    └── retry.test.ts                 # NEW — unit tests for retry logic
```

**Structure Decision**: Single Next.js App Router project. The webhook handler is extended in-place. New Square customer helpers follow the existing pattern in `lib/square/` (e.g., `catalog.ts` → `customers.ts`). Retry logic extracted to a reusable utility. Clerk SDK client initialization centralized in `lib/webhooks/clerk.ts`.

## Complexity Tracking

> No constitution violations. Table omitted.
