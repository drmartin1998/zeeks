# Webhook Contract: Clerk Webhook Events

## Endpoint

```
POST /api/webhooks/clerk
```

## Request

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `svix-id` | Yes | Unique message identifier from Svix |
| `svix-timestamp` | Yes | Unix timestamp (seconds) when the webhook was sent |
| `svix-signature` | Yes | HMAC signature (`v1,...`) generated using `CLERK_WEBHOOK_SECRET` |
| `Content-Type` | Yes | Must be `application/json` |

### Body

The request body is a JSON object with the following shape:

```json
{
  "type": "user.created",
  "data": {
    "id": "user_abc123"
  }
}
```

**Event Types** (non-exhaustive):
- `user.created` — New user registered
- `user.updated` — User profile updated
- `user.deleted` — User account deleted
- `session.created` — New session started
- `organization.created` — New organization created

The `data` object shape varies by event type. For all user events, `data.id` is the Clerk user ID.

### Signature Verification

The request is verified using [Svix Standard Webhooks](https://docs.svix.com/receiving/verifying-payloads/how):

1. Extract `svix-id`, `svix-timestamp`, `svix-signature` headers
2. Read raw body as text (do NOT pre-parse as JSON)
3. Verify using `new Webhook(secret).verify(rawBody, headers)`

## Response

### Success (HTTP 200)

```json
{
  "success": true
}
```

### Invalid Signature (HTTP 400)

```json
{
  "error": "Invalid webhook signature"
}
```

### Missing Secret (HTTP 500)

```json
{
  "error": "Webhook secret not configured"
}
```

## Security

- The `CLERK_WEBHOOK_SECRET` is a shared secret provisioned from the Clerk Dashboard.
- It MUST be stored as a server-side environment variable only.
- It MUST NEVER appear in client-side bundles, network responses, or version control.
- All requests without a valid Svix signature are rejected with HTTP 400.
