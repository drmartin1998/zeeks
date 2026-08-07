# Contracts: Clerk Auth Migration (createRouteMatcher)

**Feature**: 032-clerk-auth-migration
**Date**: 2026-08-07

## Contract 1: Middleware Password Gate Behavior

The middleware enforces the site password gate for all non-exempt routes. This contract is unchanged from current behavior; only the implementation mechanism changes (framework-native path matching instead of `createRouteMatcher`).

### Behavior

| Request | Valid password cookie? | Result |
|---------|------------------------|--------|
| Non-exempt path | Yes | Served normally |
| Non-exempt path | No | Redirect (307) to `/password?returnTo=<path>` |
| Exempt path (`/password`, `/api/password`, `/api/webhooks`, `/__clerk`, `/.well-known`) | N/A | Served without the password gate |
| Any path (no `SITE_PASSWORD` configured) | N/A | Served without the password gate |

### Middleware invariants

- `clerkMiddleware()` is retained.
- `config.matcher` is retained unchanged.
- The redirect preserves the original path via the `returnTo` query param.

## Contract 2: ESLint Auth-Protection Rule

The `@clerk/next/require-auth-protection` rule enforces that protected resources perform an auth check. Configuration:

- `protected`: `['**']` (all resources by default)
- `public`: `['app/sign-in/**', 'app/sign-up/**']` (public auth routes)

### Behavior

- Any resource matching `protected` that lacks an auth check is flagged as an error.
- Public auth routes (sign-in/sign-up) are exempt from the requirement.