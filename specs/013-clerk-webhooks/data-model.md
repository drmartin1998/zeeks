# Data Model: Clerk Webhook Integration

## Entities

### ClerkWebhookEvent (Inbound — Read Only)

Represents a verified webhook event received from Clerk. These are ephemeral — they are logged and discarded (no persistence in v1).

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `type` | `string` | Clerk webhook payload | Event type identifier (e.g., `"user.created"`, `"user.updated"`, `"user.deleted"`) |
| `data.id` | `string` | Clerk webhook payload | The unique identifier of the affected entity (e.g., user ID, organization ID) |

**TypeScript Interface** (defined in `app/api/webhooks/clerk/route.ts`):

```typescript
interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
  };
}
```

### ClerkWebhookSecret (Configuration)

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `CLERK_WEBHOOK_SECRET` | `string` | Environment variable | Shared secret from Clerk Dashboard used for HMAC signature verification via Svix |

## Data Flow

```text
Clerk (external)
  │
  │  HTTP POST with:
  │  - Headers: svix-id, svix-timestamp, svix-signature
  │  - Body: JSON event payload
  │
  ▼
POST /api/webhooks/clerk (Route Handler)
  │
  │  1. Read raw body via req.text()
  │  2. Verify signature via Webhook.verify(rawBody, headers)
  │     └─ FAIL → 400 { error: "Invalid webhook signature" }
  │  3. Cast verified payload → ClerkWebhookEvent
  │  4. console.log(type, data.id)
  │  5. Return 200 { success: true }
  │
  ▼
Vercel Logs (console output)
```

## State Transitions

No stateful entities. Webhook events are statelessly processed and logged. Future features (e.g., database upserts) may introduce stateful entities.

## Validation Rules

- `CLERK_WEBHOOK_SECRET` must be a non-empty string. If missing → HTTP 500.
- `svix-id`, `svix-timestamp`, `svix-signature` headers must all be present and valid. Svix library enforces this during `verify()`.
- Request body must be valid JSON that matches the HMAC signature. Malformed/tampered body → HTTP 400.
