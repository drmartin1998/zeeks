# Feature Specification: Clerk Auth Migration (createRouteMatcher)

**Feature Branch**: `032-clerk-auth-migration`

**Created**: 2026-08-07

**Status**: Draft

**Input**: User description: "Clerk - DEPRECATION WARNING: 'createRouteMatcher' is deprecated and will be removed in the next major release. Use resource-based auth checks instead. Move auth checks into each page, layout, API route, or Server Function that accesses protected data. Middleware-based auth checks rely on path matching, which can diverge from how Next.js routes requests and leave protected resources reachable."

## Clarifications

### Session 2026-08-07

- Q: Should this migration also add Clerk's `require-auth-protection` lint rule to enforce that protected resources keep their auth checks over time? → A: Yes, also install and configure `@clerk/eslint-plugin` with the `require-auth-protection` rule to enforce ongoing resource protection.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove the deprecated createRouteMatcher usage (Priority: P1)

The application no longer uses the deprecated `createRouteMatcher` function from Clerk, eliminating the deprecation warning and future-proofing the auth setup against the next Clerk major release.

**Why this priority**: This is the core of the migration. Removing `createRouteMatcher` resolves the deprecation warning and prevents breakage when the function is removed in Clerk's next major version.

**Independent Test**: Can be verified by starting the development server and confirming the Clerk deprecation warning no longer appears, and by confirming no `createRouteMatcher` import remains in the codebase.

**Acceptance Scenarios**:

1. **Given** the application starts, **When** the middleware loads, **Then** no Clerk deprecation warning about `createRouteMatcher` is logged to the console.
2. **Given** the codebase is searched, **When** checking for `createRouteMatcher`, **Then** no usage of the deprecated function remains.

---

### User Story 2 - Preserve the site password gate (Priority: P1)

The site-wide password protection continues to work exactly as before, using framework-native path matching instead of `createRouteMatcher`. Public/exempt routes (password page, webhooks, Clerk assets) remain accessible without the password.

**Why this priority**: The password gate is existing behavior that must not regress during the migration. Replacing `createRouteMatcher` with native path matching must preserve identical access behavior.

**Independent Test**: Can be verified by requesting a protected page without the password cookie (redirected to the password page) and requesting an exempt route (webhooks, Clerk assets) without the password (served normally).

**Acceptance Scenarios**:

1. **Given** a visitor has no password cookie, **When** they request a protected page, **Then** they are redirected to the password page with the original path preserved.
2. **Given** a visitor has no password cookie, **When** they request an exempt route (e.g., a webhook or Clerk asset), **Then** the request is served without interruption.
3. **Given** a visitor has the correct password cookie, **When** they request a protected page, **Then** the page is served normally.

---

### User Story 3 - Keep Clerk middleware and resource-based auth checks intact (Priority: P1)

The `clerkMiddleware()` remains in place (required for Clerk to work), and protected pages, routes, and Server Actions continue to enforce their own resource-based auth checks via `auth()`.

**Why this priority**: The migration must not weaken security. Clerk's recommended model keeps `clerkMiddleware()` for request handling while each protected resource enforces its own auth check.

**Independent Test**: Can be verified by confirming protected resources (account, cart, checkout) still reject unauthenticated access through their own `auth()` checks.

**Acceptance Scenarios**:

1. **Given** a signed-out user, **When** they access a protected page, **Then** they are redirected to sign in (via the resource's auth check).
2. **Given** a signed-in user, **When** they access a protected page, **Then** the page renders normally.

---

### Edge Cases

- What happens if a route is neither protected nor exempt? It should be treated as protected (require the password cookie), matching current behavior.
- What happens when the password is not configured (no `SITE_PASSWORD`)? No password gate applies; all routes are accessible.
- What happens to the `config.matcher` export? It must remain unchanged so Clerk middleware still runs on the correct routes.
- What happens to webhooks and Clerk's internal routes? They must remain exempt from the password gate.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST NOT use the deprecated `createRouteMatcher` function from Clerk anywhere in the codebase.
- **FR-002**: The middleware MUST continue to enforce the site password gate for all non-exempt routes, redirecting visitors without the password cookie to the password page.
- **FR-003**: The middleware MUST continue to exempt the same routes as before (password page, password API, webhooks, Clerk internal routes, well-known assets) from the password gate.
- **FR-004**: The site password gate MUST use framework-native path matching (e.g., `req.nextUrl.pathname` / `config.matcher`) instead of `createRouteMatcher`.
- **FR-005**: The `clerkMiddleware()` setup MUST remain in place for Clerk to function correctly.
- **FR-006**: Protected pages, API routes, and Server Actions MUST continue to enforce their own resource-based auth checks via `auth()`.
- **FR-007**: The redirect to the password page MUST preserve the original path as a `returnTo` parameter, matching current behavior.
- **FR-008**: When no `SITE_PASSWORD` is configured, the password gate MUST NOT be applied.
- **FR-009**: The project MUST install and configure Clerk's `@clerk/eslint-plugin` with the `require-auth-protection` rule so that protected resources are checked for auth protection on an ongoing basis.

### Key Entities *(include if feature involves data)*

- **Middleware**: The request-handling layer that applies the site password gate and runs Clerk middleware.
- **Exempt Route**: A path that bypasses the password gate (password page, webhooks, Clerk assets).
- **Password Cookie**: The cookie that authorizes a visitor to access protected routes.
- **Resource-Based Auth Check**: An `auth()` check inside a protected page, API route, or Server Function.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Clerk `createRouteMatcher` deprecation warning no longer appears in the development console.
- **SC-002**: Protected pages still require the password cookie; exempt routes remain accessible without it (behavior unchanged).
- **SC-003**: Protected resources still reject unauthenticated access via their own auth checks (security unchanged).
- **SC-004**: The `clerkMiddleware()` and `config.matcher` remain present and functional.
- **SC-005**: The `require-auth-protection` lint rule is configured and passes (no unprotected resources are flagged).

## Assumptions

- The site password gate is the only use of `createRouteMatcher` in the codebase, and it is not a Clerk authentication check.
- Clerk authentication is already resource-based (via `auth()` in protected pages/routes), so no additional auth checks need to be added to those resources.
- The `config.matcher` export in the middleware is retained unchanged.
- The migration is completed in one pass (not incremental), since the only `createRouteMatcher` usage is the password gate.
- Clerk's `@clerk/eslint-plugin` (with the `require-auth-protection` rule) is added to enforce ongoing resource protection; the protected/public globs align with the app's actual folder structure.