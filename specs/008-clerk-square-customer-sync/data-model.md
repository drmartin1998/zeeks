# Data Model: Clerk-to-Square Customer Sync

**Feature**: 008-clerk-square-customer-sync
**Date**: 2026-08-02

## Overview

This feature does not introduce a persistent database. Data flows between Clerk and Square through webhook processing. The data structures below define the shapes of data at each stage.

## Entities

### ClerkUser (from webhook payload)

Represents the user data received in a `user.created` webhook event.

| Field | Type | Source | Required | Notes |
|-------|------|--------|----------|-------|
| `id` | `string` | `data.id` | Yes | Clerk user ID |
| `firstName` | `string \| null` | `data.first_name` | No | Used for Square customer given name |
| `lastName` | `string \| null` | `data.last_name` | No | Used for Square customer family name |
| `primaryEmail` | `string` | Derived from `data.email_addresses[]` | Yes | Extracted via primary_email_address_id match, or first in array |
| `privateMetadata` | `{ squareCustomerId?: string }` | Read via Clerk Backend API | No | Present if previously synced |

### SquareCustomer

Represents a customer in Square's CRM.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `id` | `string` | Square API response | The Square customer ID saved to Clerk |
| `givenName` | `string` | Created from `firstName` | May be empty if user has no first name |
| `familyName` | `string` | Created from `lastName` | May be empty if user has no last name |
| `emailAddress` | `string` | Created from `primaryEmail` | Used for search matching |

### WebhookEvent

Represents a verified Clerk webhook event with full user data.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `type` | `string` | `data.type` | Must be `"user.created"` for processing |
| `data.id` | `string` | `data.data.id` | Clerk user ID |
| `data.first_name` | `string \| null` | `data.data.first_name` | |
| `data.last_name` | `string \| null` | `data.data.last_name` | |
| `data.email_addresses` | `EmailAddress[]` | `data.data.email_addresses` | Array of email objects |
| `data.primary_email_address_id` | `string \| null` | `data.data.primary_email_address_id` | Points to primary email's ID |

Where `EmailAddress`:
| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Email address ID |
| `email_address` | `string` | The actual email |

## State Transitions

```
[Webhook Received]
    │
    ▼
[Signature Verified?] ─── NO ──► 400 (reject)
    │
    YES
    │
    ▼
[Event type is "user.created"?] ─── NO ──► 200 (ignore, not in scope)
    │
    YES
    │
    ▼
[Extract email from payload] ─── NO EMAIL ──► 400 (invalid data)
    │
    HAS EMAIL
    │
    ▼
[Read Clerk user metadata]
    │
    ▼
[squareCustomerId exists?] ─── YES ──► 200 (idempotent skip)
    │
    NO
    │
    ▼
[Search Square by email] ─── RATE-LIMITED/TIMEOUT ──► Retry (×3) ──► 500
    │
    FOUND / NOT FOUND
    │
    ▼
[Found?] ─── YES ──► Update Clerk metadata ──► 200
    │
    NO
    │
    ▼
[Create Square customer] ─── RATE-LIMITED/TIMEOUT ──► Retry (×3) ──► 500
    │
    CREATED
    │
    ▼
[Update Clerk metadata] ─── FAILS ──► 500 (logged, Square customer orphaned)
    │
    SUCCESS
    │
    ▼
    200
```

## Validation Rules

1. **Webhook signature**: Must pass Svix `Webhook.verify()` — else 400.
2. **Event type**: Must equal `"user.created"` — else 200 (no-op for other types).
3. **Email presence**: At least one email in `email_addresses[]` — else 400.
4. **Square customer ID format**: Saved as-is from Square API response (e.g., `"ABC123..."`).
5. **Clerk metadata key**: Always `"squareCustomerId"` (constant).
