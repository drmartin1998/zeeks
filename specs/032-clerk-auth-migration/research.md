# Research: Clerk Auth Migration (createRouteMatcher)

**Feature**: 032-clerk-auth-migration
**Date**: 2026-08-07

## 1. Replacing `createRouteMatcher` with Native Path Matching

**Decision**: Replace the deprecated `createRouteMatcher` in `middleware.ts` with framework-native path matching using `req.nextUrl.pathname` for the site password gate.

**Rationale**: The middleware's only use of `createRouteMatcher` is the site password gate (an exempt-routes list: `/password`, `/api/password`, `/api/webhooks`, `/__clerk`, `/.well-known`). It is NOT a Clerk authentication gate — Clerk auth is already resource-based via `auth()` in protected pages/routes/Server Actions. Per Clerk's migration guide, `createRouteMatcher()` should be replaced with the framework's native matching (`config.matcher` and `req.nextUrl.pathname`) for non-auth path logic.

**Implementation**:
- Replace `const exemptFromPassword = createRouteMatcher([...])` with a manual check: parse `req.nextUrl.pathname` and test it against the exempt prefixes.
- Keep the rest of the middleware logic identical (the `SITE_PASSWORD` check, cookie comparison, and redirect to `/password?returnTo=<path>`).
- Keep `clerkMiddleware(async (auth, req) => {...})` and the `config.matcher` export unchanged — they are required for Clerk to function (FR-005).

**Alternatives considered**:
- **Move the password gate to each resource**: Rejected — the password gate is a cross-cutting concern independent of Clerk auth; keeping it in the middleware preserves the existing single-point behavior (FR-002).
- **Keep `createRouteMatcher`**: Rejected — it is deprecated and will be removed in Clerk's next major release (FR-001).

## 2. Adding the `require-auth-protection` Lint Rule

**Decision**: Install `@clerk/eslint-plugin` and configure the `require-auth-protection` rule in `eslint.config.mjs` to enforce that protected resources keep their auth checks on an ongoing basis (clarification Q1, FR-009).

**Rationale**: Clerk's migration guide recommends this rule to prevent future resources from being left unprotected. The project uses ESLint 9 flat config (`eslint.config.mjs`), which is supported.

**Implementation**:
- Add `@clerk/eslint-plugin` as a devDependency (pinned per Clerk guidance).
- In `eslint.config.mjs`, register the plugin and the `@clerk/next/require-auth-protection` rule with `protected: ['**']` and `public: ['app/sign-in/**', 'app/sign-up/**']` (mirroring the app's public routes).
- Run `npm run lint` to confirm the rule passes (no unprotected resources flagged) (SC-005).

**Note**: The rule is experimental; pin the version. If the Bulk Fixer CLI is used, review its changes before applying (it can add protection automatically).

**Alternatives considered**:
- **No lint rule**: Rejected — clarification Q1 chose to add it for ongoing protection.
- **Incremental protected globs**: Rejected — the migration is a single small slice; `protected: ['**']` with `public` for sign-in/sign-up is sufficient.

## 3. No Change to Resource-Based Auth

**Decision**: Protected pages, API routes, and Server Actions already use `auth()`; no additional auth checks are added (FR-006).

**Rationale**: Clerk auth is already resource-based. The middleware's `createRouteMatcher` was only the password gate, not a Clerk auth gate. Removing it does not weaken authentication because every protected resource enforces its own `auth()` check.

**Implementation**:
- Verify protected resources (account, cart, checkout pages; account/cart actions; account profile API) continue to call `auth()` and handle unauthenticated access (SC-003).

## Assumptions

- The `@clerk/eslint-plugin` version is pinned per Clerk guidance (experimental rule).
- The validation efforts focus on confirming the password gate and existing auth checks behave identically after the migration.