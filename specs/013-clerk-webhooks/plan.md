# Implementation Plan: Clerk Webhook Integration

**Branch**: `013-clerk-webhooks` | **Date**: 2026-08-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/013-clerk-webhooks/spec.md`

## Summary

Create a secure Next.js App Router API route at `POST /api/webhooks/clerk` that receives webhook events from Clerk. The route verifies the webhook signature using the Svix library and the `CLERK_WEBHOOK_SECRET` environment variable, logs the event type and data ID upon success, and returns appropriate HTTP status codes (200 for success, 400 for invalid signature, 500 for misconfiguration).

## Technical Context

**Language/Version**: TypeScript 5 (strict mode), React 19, Next.js 16

**Primary Dependencies**: svix (^1.99.1, already installed), Next.js Route Handlers

**Storage**: N/A (no persistent storage; events are logged to console only in v1)

**Testing**: Vitest (unit + integration), Playwright (E2E)

**Target Platform**: Vercel (Node.js serverless)

**Project Type**: Next.js web application (App Router)

**Performance Goals**: Webhook signature verification <5ms overhead per request. Endpoint responds within 50ms p95 under normal conditions.

**Constraints**: Server-side only (`CLERK_WEBHOOK_SECRET` never exposed to browser); must not block the event sender (fast 200/400 response); raw body must be read as text before verification

**Scale/Scope**: 1 endpoint, 1 environment variable, 0 database tables. Handles all Clerk event types in v1.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | PASS | Route Handler is server-side only. No client component involvement. The `POST` handler runs entirely on the server. |
| II | API Route Security | PASS | `CLERK_WEBHOOK_SECRET` is a server-only environment variable read via `process.env` — never exposed to the browser. Svix signature verification is the security boundary. No Square API communication involved. |
| III | Type-Safe Data Flow | PASS | `ClerkWebhookEvent` interface defines `type` and `data.id`. The `POST` handler has an explicit `Promise<NextResponse<...>>` return type. `@/*` imports only (no relative paths). |
| IV | Component Architecture | PASS | No new UI components. Feature is pure backend API route. |
| V | Performance & Caching | PASS | Stateless route handler. Svix `verify()` is O(1) HMAC comparison. No caching needed (webhooks are one-shot events). |
| VI | Gherkin-First Testing | PASS | `.feature` file will be created with scenarios covering valid/invalid signatures and missing secret. Integration tests will cover the Route Handler with mocked Svix verification. |
| VII | No Mock Data Fallback | PASS | No data fallback. Route returns error responses on failure, never mock data. |

## Project Structure

### Documentation (this feature)

```text
specs/013-clerk-webhooks/
├── spec.md              # Feature specification (this PRD)
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (webhook contract)
│   └── clerk-webhook.md # Expected request/response shapes
└── features/
    └── clerk-webhooks.feature  # Gherkin scenarios
```

### Source Code (repository root)

```text
app/api/webhooks/clerk/
├── route.ts             # NEW: POST handler with Svix verification
└── __tests__/
    └── route.test.ts    # NEW: Integration tests

.env.local               # MODIFY: add CLERK_WEBHOOK_SECRET
```

## Complexity Tracking

No constitution violations. All seven principles pass without exception.
