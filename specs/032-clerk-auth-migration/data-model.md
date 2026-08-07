# Data Model: Clerk Auth Migration (createRouteMatcher)

**Feature**: 032-clerk-auth-migration
**Date**: 2026-08-07

## Entities

### 1. Exempt Route

A path that bypasses the site password gate. Replaced from a `createRouteMatcher` pattern list to a framework-native path check.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `pattern` | `string` | Middleware config | A path prefix that is exempt from the password gate (e.g., `/password`, `/api/webhooks`) |

**Exempt patterns (unchanged from current behavior)**:
- `/password`
- `/api/password`
- `/api/webhooks`
- `/__clerk`
- `/.well-known`

### 2. Password Cookie

The cookie that authorizes a visitor to access protected routes.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `name` | `"site_password"` | Middleware | Cookie name |
| `value` | `string` | Set by the password API | Compared against `SITE_PASSWORD` |

### 3. Middleware

The request-handling layer that applies the site password gate and runs Clerk middleware.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `clerkMiddleware` | function | `@clerk/nextjs/server` | Required for Clerk to function (kept) |
| `config.matcher` | string[] | Middleware export | Route matcher for which requests run middleware (kept unchanged) |
| exempt check | `(pathname) => boolean` | Middleware | Native path check replacing `createRouteMatcher` |

### 4. Resource-Based Auth Check

An `auth()` call inside a protected page, API route, or Server Function that enforces authentication independently of the middleware.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `auth()` | function | `@clerk/nextjs/server` | Returns `{ userId, redirectToSignIn }`; used to reject unauthenticated access |

## Relationships

- **Middleware** 1—N **Exempt Route**: the middleware exempts a fixed set of route patterns from the password gate.
- **Middleware** 1—1 **Password Cookie**: the middleware compares the cookie value to `SITE_PASSWORD`.
- **Protected Resource** 1—1 **Auth Check**: each protected page/route/Server Action enforces its own `auth()` check (independent of the middleware).

## Validation Rules

- A request to a non-exempt path without the correct password cookie MUST be redirected to `/password?returnTo=<path>` (FR-002, FR-007).
- A request to an exempt path MUST be served without the password gate (FR-003).
- When `SITE_PASSWORD` is not configured, the password gate MUST NOT apply (FR-008).
- The `config.matcher` export MUST remain unchanged (FR-005).
- No `createRouteMatcher` usage MAY remain (FR-001).
- Protected resources MUST retain their `auth()` checks (FR-006).

## State Transitions (Middleware request handling)

- **Request to non-exempt path, valid password cookie** → served normally.
- **Request to non-exempt path, no/invalid password cookie** → redirected to `/password?returnTo=<path>`.
- **Request to exempt path** → served without the password gate.
- **No `SITE_PASSWORD` configured** → all routes served without the password gate.