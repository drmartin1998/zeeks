# Quickstart: Clerk Auth Migration (createRouteMatcher)

**Feature**: 032-clerk-auth-migration
**Date**: 2026-08-07

## Prerequisites

- [ ] Dev server running (`vercel dev` on port 3000; check `lsof -ti:3000` first, reuse if already running)
- [ ] `.env.local` configured with `SITE_PASSWORD` and the Clerk/Square vars
- [ ] `@clerk/eslint-plugin` installed (devDependency)
- [ ] TypeScript compiles cleanly: `tsc --noEmit`
- [ ] Lint passes: `npm run lint`

## Validation Scenarios

### VS-1: No `createRouteMatcher` deprecation warning

1. Start the dev server.
2. **Expected**: No Clerk deprecation warning about `createRouteMatcher` appears in the console.

### VS-2: No `createRouteMatcher` usage remains

```bash
grep -rn "createRouteMatcher" --include="*.ts" --include="*.tsx" . | grep -v node_modules
```

**Expected**: No matches (the deprecated function is fully removed).

### VS-3: Protected page redirects to the password page without a cookie

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}" http://localhost:3000/
```

**Expected**: A redirect (HTTP 3xx) to `/password?returnTo=/`.

### VS-4: Exempt route is served without a password cookie

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/webhooks/clerk
```

**Expected**: HTTP 2xx/4xx from the handler (not redirected to `/password`), confirming the webhook route is exempt.

### VS-5: Protected page is served with the correct password cookie

```bash
curl -s -o /dev/null -w "%{http_code}" -b "site_password=<SITE_PASSWORD>" http://localhost:3000/
```

**Expected**: HTTP 200 (page served normally).

### VS-6: Protected resources still enforce auth

1. Sign out / use an incognito window.
2. Navigate to `/account`, `/cart`, or `/checkout`.
3. **Expected**: Redirected to sign in (via the resource's `auth()` check).

### VS-7: ESLint `require-auth-protection` rule passes

```bash
npm run lint
```

**Expected**: No `@clerk/next/require-auth-protection` errors (no unprotected resources flagged).

## Automated / Static Checks

- `npm run lint` — confirms no `createRouteMatcher` usage and the `require-auth-protection` rule passes.
- `tsc --noEmit` — confirms the middleware/eslint config type-check.
- Manual verification of the password gate and protected-resource auth (VS-3 through VS-6).

## Definition of Done

- `tsc --noEmit` passes; `npm run lint` passes with zero errors.
- No `createRouteMatcher` usage remains (VS-2).
- The password gate behaves identically (VS-3, VS-4, VS-5).
- Protected resources still enforce auth (VS-6).
- The `require-auth-protection` lint rule is configured and passes (VS-7).
- Every `@US{N}` scenario in `features/clerk-auth-migration.feature` is satisfied.