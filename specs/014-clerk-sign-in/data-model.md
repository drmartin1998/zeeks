# Data Model: Clerk Sign-In from Profile Icon

**Feature**: 014-clerk-sign-in | **Date**: 2026-08-02

## Entities

### Authenticated User (Clerk-managed)

Clerk is the authoritative source for user identity. No new database tables are created.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `id` | string (Clerk user ID) | Clerk | Unique identifier; e.g., `user_2x...` |
| `email` | string | Clerk | Primary email address |
| `firstName` | string \| null | Clerk | User's first name |
| `lastName` | string \| null | Clerk | User's last name |
| `imageUrl` | string \| null | Clerk | Avatar URL (used by UserButton) |
| `squareCustomerId` | string \| null | Clerk privateMetadata | Set by webhook pipeline (spec 008/013) |

**Lifecycle**:
1. **Created** when user signs up via Clerk modal (`user.created` webhook fires → Square customer sync)
2. **Active** while Clerk session is valid (default session lifetime)
3. **Expired** when session ends (browser close, sign-out, or token expiry)

### Authentication Session (Clerk-managed)

No local representation — Clerk manages session tokens via cookies (`__session`).

| Property | Value |
|----------|-------|
| Storage | Clerk-managed HTTP-only cookie |
| Lifetime | Clerk Dashboard default (typically 30 days) |
| Renewal | Automatic via Clerk token refresh |
| Scope | All pages under the configured Clerk domain |

## Relationships

```
Authenticated User (Clerk)
    │
    ├── 1:1 ── Square Customer (via squareCustomerId in privateMetadata)
    │           └── Created/updated by webhook pipeline (spec 008/013)
    │
    └── 1:N ── Auth Sessions
                └── Managed entirely by Clerk
```

## State Transitions

```
[No Session] ──(sign up/sign in)──▶ [Active Session]
                                         │
                              ┌──────────┼──────────┐
                              │          │          │
                          (sign out)  (expiry)  (token refresh)
                              │          │          │
                              ▼          ▼          │
                        [No Session]◀──[No Session]  │
                                                     │
                              ┌──────────────────────┘
                              ▼
                        [Active Session] (renewed)
```

## Validation Rules

- Email: Validated by Clerk during sign-up (format + uniqueness within Clerk)
- Password: Validated by Clerk (minimum strength configured in Clerk Dashboard)
- Google OAuth: Validated by Clerk/Google (token exchange)
- `squareCustomerId`: Set server-side only by webhook — never from client
