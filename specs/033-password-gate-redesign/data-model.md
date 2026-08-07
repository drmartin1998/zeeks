# Data Model: Password Gate Redesign

**Feature**: 033-password-gate-redesign
**Date**: 2026-08-07

## Entities

### 1. Password Cookie

The `site_password` cookie that authorizes a visitor to access protected routes.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `name` | `"site_password"` | API route | Cookie name |
| `value` | `string` | Submitted password | Compared against `SITE_PASSWORD` |
| `maxAge` | `number` | API route | **Changed from 7 days (604800) to 24 hours (86400)** |

### 2. ReturnTo

The query parameter preserving the visitor's original destination.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `returnTo` | `string` | Password page URL query | Original path to redirect to after successful access |

### 3. Password Gate Page

The site-wide page shown to visitors who have not entered the password.

| Section | Content |
|---------|---------|
| Background | Dark purple with central glow + ember accents |
| Header | Zeeks logo (centered) |
| Headline | "SOMETHING EPIC IS COMING" |
| Subhead | Teaser copy about TCGs, comics, board games, RPGs, miniatures |
| Form | Password input + "UNLOCK EARLY ACCESS" button + hint text |
| Footer | "COMING Q3 2026" launch text + social icon row |

## Relationships

- **Password Gate Page** 1—1 **Password Cookie**: the page's form sets the cookie via the API on correct password.
- **Password Gate Page** 1—1 **ReturnTo**: the page reads `returnTo` to redirect after success.
- **Password Cookie** N—1 **SITE_PASSWORD**: the cookie value is validated against the configured site password.

## Validation Rules

- An incorrect password MUST NOT set the cookie and MUST NOT grant access (FR-003).
- A correct password MUST set the cookie with a 24-hour `maxAge` and redirect to `returnTo` (FR-004, FR-005).
- When `SITE_PASSWORD` is not configured, the gate MUST NOT apply (FR-006).

## State Transitions (Password Gate)

- **Visitor with no cookie requests a protected page** → redirected to `/password?returnTo=<path>`.
- **Visitor submits incorrect password** → error shown, no cookie, stays on gate.
- **Visitor submits correct password** → cookie set (24h), redirect to `returnTo`.
- **Cookie expires after 24h** → visitor is redirected to the gate again on next protected request.