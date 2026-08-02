# Quickstart: Clerk Webhook Integration

## Prerequisites

- Clerk account with a configured application
- Clerk webhook endpoint configured in Clerk Dashboard pointing to `https://<your-domain>/api/webhooks/clerk`
- Clerk webhook signing secret copied from Clerk Dashboard
- `CLERK_WEBHOOK_SECRET` added to `.env.local` (local dev) and Vercel Environment Variables (production):
  ```
  CLERK_WEBHOOK_SECRET="whsec_..."
  ```
- `svix` package installed (already in `dependencies`: ^1.99.1)
- Dev server available (check `lsof -ti:3000` first)

## Validation Scenarios

### 1. Endpoint rejects requests with invalid signature

```bash
# Send a request with no svix headers (triggers signature verification failure)
curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -d '{"type":"user.created","data":{"id":"user_123"}}'
```

**Expected**: Returns `400` with body `{"error":"Invalid webhook signature"}`

### 2. Endpoint rejects requests when secret is not configured

```bash
# Temporarily unset the secret and restart dev server (restore after test)
# The endpoint should return 500

# Without the secret configured, any POST returns 500
curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected**: Returns `500` with body `{"error":"Webhook secret not configured"}`

### 3. Valid webhook is accepted and logged

```bash
# Generate a valid signed request using the Svix CLI or Clerk Dashboard's "Send Test Event" button.
# Alternatively, use a script to generate a valid svix signature:

# Using the Clerk Dashboard:
# 1. Go to Clerk Dashboard → Webhooks → Your Endpoint
# 2. Click "Send Test Event" for user.created
# 3. Check your dev server console for log output:
#    "Clerk webhook received — type: user.created, data.id: user_<id>"
```

**Expected**: Returns `200` with body `{"success":true}`, and the console shows the event type and data ID.

### 4. Endpoint handles different Clerk event types

Send test events for `user.updated` and `user.deleted` via the Clerk Dashboard.

**Expected**: Each event type is logged correctly with its respective type string and data ID.

## Test Commands

```bash
# Static checks
tsc --noEmit
npm run lint

# Unit + Integration tests
npm test

# E2E tests (if applicable)
npm run test:e2e
```

## Expected File Changes

| File | Change |
|------|--------|
| `app/api/webhooks/clerk/route.ts` | **NEW** — POST handler with Svix webhook signature verification |
| `app/api/webhooks/clerk/__tests__/route.test.ts` | **NEW** — Integration tests |
| `.env.local` | **MODIFY** — Add `CLERK_WEBHOOK_SECRET` |

## Local Testing with Svix CLI

To test with a valid signature locally without the Clerk Dashboard:

```bash
# Install the Svix CLI (one-time)
npm install -g svix

# Generate a signed webhook request
svix webhook send \
  --secret "$CLERK_WEBHOOK_SECRET" \
  --url http://localhost:3000/api/webhooks/clerk \
  --payload '{"type":"user.created","data":{"id":"user_test123"}}'
```

The Svix CLI will automatically generate the correct `svix-id`, `svix-timestamp`, and `svix-signature` headers.
