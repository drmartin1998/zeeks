# Research: Clerk-to-Square Customer Sync

**Feature**: 008-clerk-square-customer-sync
**Date**: 2026-08-02

## 1. Clerk Backend API — Reading & Updating User Metadata

**Decision**: Install `@clerk/backend` and use `createClerkClient` with `CLERK_SECRET_KEY` for server-side user operations (read user metadata, update privateMetadata).

**Rationale**:
- The feature needs two Clerk Backend API operations: `GET /users/{userId}` (to read existing `squareCustomerId`) and `PATCH /users/{userId}/metadata` (to save the Square customer ID).
- `@clerk/backend` is the dedicated backend-only SDK — lighter than `@clerk/nextjs` (which includes frontend components). It provides typed methods (`users.getUser()`, `users.updateUserMetadata()`) with proper error handling.
- Constitution Principle III (Type-Safe Data Flow) requires typed interfaces. Using the SDK provides type-safe responses rather than raw `fetch` with manual typing.
- `@clerk/backend` requires only `CLERK_SECRET_KEY` as an environment variable — no frontend configuration needed.

**Alternatives considered**:
- `@clerk/nextjs`: Rejected — includes ~50+ transitive dependencies for frontend UI components not needed for a backend-only webhook handler. The `specs/013-clerk-webhooks` spec established this precedent.
- Direct `fetch` to Clerk REST API: Rejected — would require manual type definitions, error handling, and authentication header management.
- `replaceUserMetadata()` vs `updateUserMetadata()`: Using `updateUserMetadata()` (PATCH with deep merge) because we only want to set `privateMetadata.squareCustomerId` without touching other metadata keys.

## 2. Square Customers API — Search & Create

**Decision**: Use the existing `squareClient` from `lib/square/client.ts`, accessing `squareClient.customers.search()` and `squareClient.customers.create()`.

**Rationale**:
- The Square SDK v45 is already installed and configured in `lib/square/client.ts` with `SQUARE_ACCESS_TOKEN`.
- The `customers` sub-API is available on the existing client — no new initialization needed.
- `searchCustomers` supports `emailAddress.fuzzy` filter for matching by email (fuzzy with full email provides effectively exact matching).
- `createCustomer` accepts `givenName`, `familyName`, `emailAddress` — matching the Clerk user payload fields.
- `createCustomer` requires an `idempotencyKey` parameter. A random UUID is sufficient since application-level deduplication prevents duplicate creation.

**Alternatives considered**:
- New Square client instance: Rejected — reuses existing configuration and token management.
- Exact vs fuzzy email search: The `emailAddress.fuzzy` filter with a full email address provides effectively exact matching. Square does not offer a stricter "exact" email filter.

## 3. Email Extraction from Clerk Webhook Payload

**Decision**: Extract the primary email from `data.email_addresses[]` where `id === data.primary_email_address_id`, falling back to the first email in the array if no primary is set.

**Rationale**:
- Clerk's `user.created` event includes `email_addresses[]` with `id`, `email_address`, and verification status per entry.
- The `primary_email_address_id` field identifies the canonical primary email.
- Fallback to first array element handles edge cases (e.g., brief race conditions on signup).
- The spec (FR-002) requires using the primary email or first available.

## 4. Exponential Backoff Retry Strategy

**Decision**: Implement a generic `withRetry()` utility in `lib/webhooks/retry.ts` using exponential backoff: 1s → 2s → 4s delays (max 3 attempts). Use `AbortSignal.timeout(3000)` for per-call 3-second timeout.

**Rationale**:
- Spec FR-011 requires 3-second timeout and up to 3 retries with exponential backoff.
- `AbortSignal.timeout()` is available in Node.js 18+ (Next.js 16 uses Node 20+) and integrates with `fetch`-based SDK calls.
- Extracting retry logic into a reusable utility allows isolated testing and reuse.

**Alternatives considered**:
- Fixed retry delay: Rejected — exponential backoff is better for rate-limiting scenarios.
- Square SDK's built-in retry: The Square Node.js SDK does not have per-call retry configuration.

## 5. Environment Variable: CLERK_SECRET_KEY

**Decision**: Add `CLERK_SECRET_KEY` to environment validation. This is separate from `CLERK_WEBHOOK_SECRET` (Svix verification).

**Rationale**:
- `CLERK_WEBHOOK_SECRET` is for Svix webhook verification (already configured).
- `CLERK_SECRET_KEY` is for Clerk Backend API authentication (metadata read/update).
- Following the existing pattern in `lib/env.ts` (Zod validation at import time).

## 6. Idempotency Strategy

**Decision**: Two-layer check:
1. Before any Square API call: Read Clerk user's `privateMetadata.squareCustomerId`. If present, return 200.
2. Email search-first approach prevents duplicate Square customer creation at the application level.

**Rationale**:
- Layer 1 covers Clerk webhook redelivery (most common duplicate case).
- Reading the user first costs one Clerk API call but saves up to two Square API calls.
- Square `createCustomer` requires an `idempotencyKey` — a random UUID is sufficient.

## 7. Error Logging Format

**Decision**: Use `console.log` (success) and `console.error` (failure), following the existing webhook handler pattern. Log user ID, masked email, event type, and error details.

**Rationale**:
- The existing handler uses `console.log`/`console.error` — consistency.
- Vercel captures console output in function logs.
- Email masking (e.g., `j***@example.com`) balances observability with privacy.

