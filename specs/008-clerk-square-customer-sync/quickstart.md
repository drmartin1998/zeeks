# Quickstart: Clerk-to-Square Customer Sync

**Feature**: 008-clerk-square-customer-sync
**Date**: 2026-08-02

## Prerequisites

1. **Environment Variables** (in `.env.local` and Vercel):

   ```bash
   CLERK_WEBHOOK_SECRET="whsec_..."       # From Clerk Dashboard → Webhooks → Signing Secret
   CLERK_SECRET_KEY="sk_live_..."         # From Clerk Dashboard → API Keys
   SQUARE_ACCESS_TOKEN="EAAA..."          # From Square Developer Dashboard
   SQUARE_LOCATION_ID="L..."              # From Square Developer Dashboard
   SQUARE_APPLICATION_ID="sq0idp-..."     # From Square Developer Dashboard
   ```

2. **New Dependency**:

   ```bash
   npm install @clerk/backend
   ```

3. **Clerk Webhook Configuration**:
   - In Clerk Dashboard → Webhooks, ensure the endpoint points to `https://<your-domain>/api/webhooks/clerk`
   - Enable the `user.created` event type
   - Copy the Signing Secret to `CLERK_WEBHOOK_SECRET`

4. **Square API Permissions**:
   - The Square access token must have `CUSTOMERS_READ` and `CUSTOMERS_WRITE` permissions

## Validation Scenarios

### Scenario 1: New User → New Square Customer Created

**Prerequisite**: No Square customer exists with `test-sync@example.com`.

1. Register a new user in Clerk with email `test-sync@example.com`, first name "Test", last name "Sync".
2. Check Clerk Dashboard → Users → [user] → Metadata:
   - `privateMetadata.squareCustomerId` should contain a Square customer ID.
3. Check Square Dashboard → Customers:
   - A customer with email `test-sync@example.com`, given name "Test", family name "Sync" should exist.

### Scenario 2: Existing Square Customer → Linked

**Prerequisite**: A Square customer exists with email `existing-user@example.com` (ID: `EXISTING_ID`). The Clerk user should NOT have `squareCustomerId` in metadata.

1. Register a new Clerk user with email `existing-user@example.com`.
2. Check Clerk Dashboard → Users → [user] → Metadata:
   - `privateMetadata.squareCustomerId` should be `EXISTING_ID`.
3. Check Square Dashboard → Customers:
   - No duplicate customer with email `existing-user@example.com` should exist.

### Scenario 3: Duplicate Webhook → Idempotent Skip

**Prerequisite**: A Clerk user already has `squareCustomerId` in private metadata.

1. Trigger a `user.created` webhook for the same user (e.g., via Clerk Dashboard "Send Test Event").
2. Verify the webhook handler returns 200.
3. Check logs — no Square API calls should be logged.

### Scenario 4: No Email → 400 Rejection

1. Send a `user.created` webhook payload where `email_addresses` is an empty array `[]`.
2. Verify the response status is 400.
3. Verify no Square API calls are made.

### Scenario 5: Square API Unreachable → 500

**Prerequisite**: Temporarily set `SQUARE_ACCESS_TOKEN` to an invalid value.

1. Register a new user.
2. Verify the webhook handler returns 500.
3. Restore the valid `SQUARE_ACCESS_TOKEN`.
4. Wait for Clerk's automatic webhook redelivery.

## Running Tests

```bash
# Unit tests (retry logic, email extraction, customer helpers)
npm test -- lib/webhooks/__tests__/retry.test.ts
npm test -- lib/square/__tests__/customers.test.ts

# Integration tests (Route Handler)
npm test -- app/api/webhooks/clerk/__tests__/route.test.ts

# All tests
npm test
```

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `app/api/webhooks/clerk/route.ts` | MODIFY | Add `user.created` processing logic |
| `lib/square/client.ts` | MODIFY | Export `customersApi` |
| `lib/square/customers.ts` | NEW | `findCustomerByEmail()`, `createCustomer()` |
| `lib/square/types.ts` | MODIFY | Add `SquareCustomer` type |
| `lib/webhooks/clerk.ts` | NEW | Clerk Backend SDK client initialization |
| `lib/webhooks/retry.ts` | NEW | `withRetry()` exponential backoff utility |
| `lib/env.ts` | MODIFY | Add `CLERK_SECRET_KEY` validation |
| `app/api/webhooks/clerk/__tests__/route.test.ts` | MODIFY | Add customer sync test cases |
| `lib/square/__tests__/customers.test.ts` | NEW | Unit tests for customer helpers |
| `lib/webhooks/__tests__/retry.test.ts` | NEW | Unit tests for retry utility |
| `.env.local` | MODIFY | Add `CLERK_SECRET_KEY` |
| `package.json` | MODIFY | Add `@clerk/backend` dependency |
