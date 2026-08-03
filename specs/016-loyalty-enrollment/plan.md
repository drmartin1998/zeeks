# Implementation Plan: Automatic Loyalty Program Enrollment

**Branch**: `016-loyalty-enrollment` | **Date**: 2026-08-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/016-loyalty-enrollment/spec.md`

## Summary

Extend the existing Clerk `user.created` webhook handler to automatically enroll new customers in the Square Loyalty program. After the Square customer ID is created or found and saved to Clerk metadata, the handler searches for an existing loyalty account by `customerIds`, creates one if not found, and stores the loyalty account ID in Clerk `privateMetadata`. Loyalty enrollment is non-blocking — errors are logged and the webhook always returns 200 if the Square customer sync succeeded. If `SQUARE_LOYALTY_PROGRAM_ID` is not configured, enrollment is silently skipped.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: Next.js 16 (App Router), Square SDK v45, `@clerk/backend` (existing), Svix v1.99.1 (existing)

**Storage**: Clerk `privateMetadata` gains an optional `loyaltyAccountId` field alongside the existing `squareCustomerId`. No new database.

**Testing**: Vitest + MSW (integration for webhook route), Vitest (unit for loyalty helpers). Following Testing Trophy.

**Target Platform**: Vercel serverless functions (Next.js Route Handler)

**Project Type**: Web application backend (Route Handler extension)

**Performance Goals**: Loyalty search + create adds <3 seconds to webhook processing (within existing 5s budget). Same retry policy as Square customer operations (3 attempts, exponential backoff, 3s timeout).

**Constraints**: All Square API calls server-side via Route Handler. Loyalty failure must not block customer sync. New env var `SQUARE_LOYALTY_PROGRAM_ID` validated in `lib/env.ts`. Idempotency via existing Square customer ID check plus loyalty account search.

**Scale/Scope**: Single Route Handler modification, 1 new file (`lib/square/loyalty.ts`), env var addition. 3 user stories, 8 functional requirements, 9 Gherkin scenarios.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | ✅ PASS | Webhook handler is a Route Handler — server-side only. No client components involved. |
| II | API Route Security | ✅ PASS | Square API calls flow through the Route Handler. Square token and Clerk secret are server-only env vars. New `SQUARE_LOYALTY_PROGRAM_ID` validated in `lib/env.ts`. |
| III | Type-Safe Data Flow | ✅ PASS | Zod-validated env vars. Typed interfaces for loyalty account creation/response. `@/*` imports only. TypeScript strict mode. |
| IV | Vercel-Native Performance | ✅ PASS | Loyalty operations add minimal overhead within existing webhook budget. `withRetry` handles transient failures. No additional caching needed — webhook is one-shot. |
| V | Progressive Enhancement | ✅ PASS | Loyalty enrollment is additive — degrades gracefully. Core customer sync works without loyalty. |
| VI | Gherkin-First Testing (Testing Trophy) | ✅ PASS | 9 Gherkin scenarios in `.feature` file. Integration tests (RTL + MSW) for the extended webhook handler. Unit tests for loyalty helper functions. |
| VII | No Mock Data Fallback | ✅ PASS | Live Square API calls only. No mock loyalty data. Errors logged and handled, not substituted. |

**Gate Result**: ALL PASS. No violations or exceptions required.

## Project Structure

### Documentation (this feature)

```text
specs/016-loyalty-enrollment/
├── plan.md              # This file
├── spec.md              # Feature specification
├── features/
│   └── loyalty-enrollment.feature  # Gherkin scenarios
├── checklists/
│   └── requirements.md  # Quality checklist (to be created)
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (files to create/modify)

```text
app/api/webhooks/clerk/
├── route.ts                        # MODIFY — add loyalty enrollment after customer sync
└── __tests__/
    └── route.test.ts               # MODIFY — add loyalty enrollment test cases

lib/
├── env.ts                          # MODIFY — add SQUARE_LOYALTY_PROGRAM_ID (optional)
├── square/
│   ├── loyalty.ts                  # NEW — createLoyaltyAccount, searchLoyaltyAccount helpers
│   └── __tests__/
│       └── loyalty.test.ts         # NEW — unit tests
└── webhooks/
    ├── clerk.ts                    # MODIFY — add setLoyaltyAccountId helper (optional)
    └── __tests__/
        └── clerk.test.ts           # MODIFY — add loyalty metadata tests
```

**Structure Decision**: Loyalty account creation logic is extracted to `lib/square/loyalty.ts` following the existing pattern (`lib/square/customers.ts`). The webhook handler calls these helpers inline after the Square customer sync completes. Loyalty account ID storage in Clerk metadata uses the existing `setSquareCustomerId` pattern.

## Complexity Tracking

> No constitution violations requiring justification.

## Data Flow

```
Clerk user.created webhook
    │
    ├── Verify signature (Svix)
    ├── Extract email, name, phone numbers
    ├── Check idempotency (squareCustomerId in Clerk metadata)
    │       └── If exists → return 200 (skip loyalty too)
    ├── Search/find Square customer by email
    ├── Create Square customer if not found
    ├── Save squareCustomerId to Clerk metadata
    │
    └── [NEW] Loyalty enrollment (non-blocking):
            ├── SQUARE_LOYALTY_PROGRAM_ID not set?
            │       └── Log warning, skip, return 200
            ├── Search loyalty accounts by customerIds
            │       └── Account exists? → skip, return 200
            └── Create loyalty account with:
                    ├── programId (env var)
                    ├── customerId (Square customer ID)
                    ├── mapping.phoneNumber (Clerk primary phone, if available)
                    └── idempotencyKey (derived from Clerk user ID)
                        └── Error? → Log error, return 200
```

## API Reference

| API | Method | Parameters |
|-----|--------|------------|
| `loyaltyApi.accounts.search` | POST | `query.customerIds: string[]` |
| `loyaltyApi.accounts.create` | POST | `loyaltyAccount: { programId, customerId, mapping? }`, `idempotencyKey` |
