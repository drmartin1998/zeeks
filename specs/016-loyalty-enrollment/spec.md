# Feature Specification: Automatic Loyalty Program Enrollment

**Feature Branch**: `016-loyalty-enrollment`
**Created**: 2026-08-02
**Status**: Draft
**Input**: "As a customer, when I sign up for an online account, I want to automatically be enrolled in the store's loyalty program."

## Clarifications

### Session 2026-08-02

- Q: How should the system handle the phone number requirement for Square loyalty account mapping? — A: Extract the primary phone number from the Clerk webhook payload (`data.phone_numbers`). If no phone number is available, skip loyalty enrollment entirely — log a warning and return 200. A phone number is required because Square's only loyalty account mapping type is PHONE (E.164 format).

- Q: What happens if the loyalty program is not configured (no program ID env var)? — A: Skip enrollment entirely, log a warning, and return 200 for the Clerk sync. The customer sync still succeeds — loyalty is additive, not blocking.

- Q: Should the system check for an existing loyalty account before creating one? — A: Yes. Search `loyaltyApi.accounts.search({ query: { customerIds: [squareCustomerId] } })` first. If an account already exists, skip creation (idempotency).

- Q: How should the loyalty program ID be obtained? — A: A new environment variable `SQUARE_LOYALTY_PROGRAM_ID` validated in `lib/env.ts`.

- Q: What happens when Square returns an error during loyalty enrollment? — A: Log the error with user context. The webhook still returns 200 — the Square customer sync succeeded and the Clerk profile is already updated. Loyalty enrollment failure is non-blocking. The customer can be enrolled later or manually.

- Q: Should the loyalty account ID be stored in Clerk privateMetadata? — A: No. The dashboard already searches loyalty accounts by `customerIds`. Storing the ID adds unnecessary complexity with no benefit.

## User Stories

### US1 (P1) — Automatic Enrollment on Sign-Up

**Why this priority**: Every new customer should be enrolled in the loyalty program without friction. This is the core value — customers start earning points from their first purchase.

**Independent Test**: Create a new Clerk user with a phone number; verify the webhook calls `loyaltyApi.accounts.create` and a loyalty account is linked to the Square customer.

**Acceptance Scenarios**:

1. **Given** a new user registers through Clerk with email "new@example.com" and phone "+15551234567", **When** the Clerk `user.created` webhook fires and a Square customer is created, **Then** a loyalty account is created linked to that Square customer, **And** the webhook returns 200
2. **Given** a new user registers with no phone number, **When** the Clerk `user.created` webhook fires, **Then** loyalty enrollment is skipped, a warning is logged, **And** the webhook returns 200 (customer sync succeeded)
3. **Given** a new user registers and the loyalty program ID env var is not set, **When** the Clerk `user.created` webhook fires, **Then** loyalty enrollment is skipped, a warning is logged, **And** the webhook returns 200

---

### US2 (P2) — Idempotency (Already Enrolled)

**Why this priority**: Prevent duplicate loyalty accounts when webhooks are retried. Retried webhooks must be safe.

**Independent Test**: Fire a duplicate `user.created` webhook for a user who already has a loyalty account; verify no second account is created.

**Acceptance Scenarios**:

1. **Given** a user already has a loyalty account linked to their Square customer ID, **When** a duplicate `user.created` webhook is delivered, **Then** the system detects the existing account via `searchLoyaltyAccounts`, **And** no new loyalty account is created, **And** the webhook returns 200

---

### US3 (P3) — Graceful Degradation on Loyalty API Failure

**Why this priority**: The core Clerk-to-Square sync (US1 from spec 008) must never be blocked by loyalty enrollment failure. Loyalty is a bonus, not a requirement.

**Independent Test**: Mock the loyalty API to return errors; verify the webhook still returns 200 and the Square customer was synced successfully.

**Acceptance Scenarios**:

1. **Given** the Square Loyalty API is unreachable or returns an error, **When** a `user.created` webhook fires, **Then** the error is logged with user context, **And** the Square customer sync still completes (customer was created and saved to Clerk), **And** the webhook returns 200
2. **Given** the `searchLoyaltyAccounts` call succeeds but `createLoyaltyAccount` fails, **When** a `user.created` webhook fires, **Then** the error is logged, **And** the webhook returns 200

---

### Edge Cases

- What happens when the loyalty program is configured but the program does not exist in Square (deleted/expired)? The `createLoyaltyAccount` call returns a Square error; log it and continue with 200.
- What happens when the customer has multiple phone numbers in Clerk? Use the primary phone number (matched via `primary_phone_number_id`). If no primary is set, use the first phone number.
- What happens when the Square rate limit for loyalty API is hit? The existing `withRetry()` wrapper (3 attempts, exponential backoff) handles it. If all retries fail, log and continue with 200.
- What happens when a `user.updated` webhook fires (not `user.created`)? No action — the webhook currently only processes `user.created` events. No loyalty enrollment on updates.
- What happens when the Clerk user already has a `squareCustomerId` from a prior run (idempotency check in spec 008)? The existing early return at line 100 prevents the entire handler from executing, so loyalty enrollment is also skipped.

## Functional Requirements

- **FR-001**: The `SQUARE_LOYALTY_PROGRAM_ID` environment variable MUST be validated in `lib/env.ts` (optional — feature degrades gracefully if absent)
- **FR-002**: After a Square customer ID is created or found and saved to Clerk metadata, the webhook handler MUST call `loyaltyApi.accounts.search({ query: { customerIds: [squareCustomerId] } })` to check for an existing loyalty account
- **FR-003**: If no loyalty account exists and `SQUARE_LOYALTY_PROGRAM_ID` is configured, the handler MUST call `loyaltyApi.accounts.create()` with the program ID, Square customer ID, and an idempotency key derived from the Clerk user ID
- **FR-004**: If `SQUARE_LOYALTY_PROGRAM_ID` is not set, the handler MUST log a warning and skip loyalty enrollment without failing
- **FR-005**: All loyalty API calls (search, create) MUST use the existing `withRetry()` utility for transient errors
- **FR-006**: Loyalty enrollment failure MUST NOT cause the webhook to return a non-200 status — the Clerk-to-Square customer sync is independent
- **FR-007**: Loyalty enrollment errors MUST be logged with the Clerk user ID and Square customer ID for debugging
- **FR-008**: The phone number for loyalty account mapping MUST be extracted from the Clerk webhook payload (`data.phone_numbers`), using the primary phone number when available

## Key Entities

- **Loyalty Account**: A Square LoyaltyAccount with `id`, `programId`, `customerId`, `balance` (0 on creation), `lifetimePoints` (0 on creation), `enrolledAt`, and `mapping` (phone number). Created via `loyaltyApi.accounts.create`.
- **Loyalty Program**: The store's loyalty program configuration in Square, identified by a program ID UUID stored in the `SQUARE_LOYALTY_PROGRAM_ID` environment variable.
- **Clerk User**: The existing Clerk user object with `phone_numbers` array containing `id`, `phone_number` (E.164), and `id` fields. The `primary_phone_number_id` identifies the default phone.

## Success Criteria

- **SC-001**: A new user registering with a phone number is enrolled in the loyalty program within the same webhook invocation (no async/batch processing)
- **SC-002**: A duplicate `user.created` webhook does not create a duplicate loyalty account
- **SC-003**: Loyalty API failure does not prevent the Square customer from being synced to Clerk metadata
- **SC-004**: The webhook returns 200 regardless of loyalty enrollment outcome (as long as the Square customer sync succeeded)
- **SC-005**: All loyalty API errors are logged with user context for operational visibility

## Assumptions

1. The Square Loyalty program is configured in the Square Dashboard and the program ID is available.
2. The `SQUARE_LOYALTY_PROGRAM_ID` environment variable will be set in Vercel (production) and locally for development.
3. The Square Loyalty program uses the default program (most sellers have only one). If multiple programs exist, the env var points to the desired one.
4. Clerk sign-up forms collect phone numbers. Users without a phone number are skipped for loyalty enrollment — only users with a phone number in E.164 format are enrolled.
5. The existing `loyaltyApi` export from `lib/square/client.ts` is already configured and working (verified by the dashboard feature in spec 015).
6. The idempotency check on the Square customer ID (lines 90-103 of the webhook route) ensures loyalty enrollment only runs once per user.
7. The `loyaltyApi.accounts.search` endpoint supports filtering by `customerIds` (array of Square customer IDs) — confirmed by the existing `lib/square/dashboard.ts` usage.
8. The `loyaltyApi.accounts.create` endpoint accepts `customerId` as a field on the loyalty account object.
9. The `withRetry` utility from `lib/webhooks/retry.ts` is suitable for loyalty API calls (3 attempts, exponential backoff, 3s timeout).
