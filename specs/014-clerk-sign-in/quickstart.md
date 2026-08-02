# Quickstart: Clerk Sign-In from Profile Icon

**Feature**: 014-clerk-sign-in | **Date**: 2026-08-02

## Prerequisites

- Clerk account with a configured application (same app used for specs 008/013)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` added to `.env.local` (from Clerk Dashboard → API Keys)
- `CLERK_SECRET_KEY` already configured (used by existing webhook pipeline)
- Zeeks domain added to Clerk's allowed origins (Clerk Dashboard → Domains)
- Google OAuth enabled in Clerk Dashboard (Clerk Dashboard → Social Connections)

## Setup

```bash
# 1. Install the Clerk Next.js frontend SDK
npm install @clerk/nextjs@latest

# 2. Verify environment variables are set
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | head -c 15  # Should start with pk_test_ or pk_live_
echo $CLERK_SECRET_KEY | head -c 15                    # Should start with sk_test_ or sk_live_

# 3. Verify existing webhook pipeline works
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/webhooks/clerk
# Expect 400 or 500 (validates route exists — actual auth requires Svix headers)
```

## Validation Scenarios

### Scenario 1: Unauthenticated — Sign-Up Flow

```bash
# 1. Start dev server (if not running)
lsof -ti:3000 || vercel dev

# 2. Open http://localhost:3000 in browser
# 3. Click the profile icon (User icon in top-right nav)
# 4. Verify Clerk's sign-in/sign-up modal appears
# 5. Click "Sign up" → enter email + password
# 6. Verify email verification flow (if enabled) or immediate sign-in
# 7. Verify you return to the same page you were on
# 8. Verify profile icon now shows your avatar (UserButton)
```

**Expected**: After sign-up, nav bar shows `<UserButton>` with avatar.

### Scenario 2: Unauthenticated — Sign-In Flow

```bash
# 1. Click profile icon → Clerk modal appears
# 2. Click "Sign in" → enter existing credentials
# 3. Verify you return to the current page, authenticated
```

**Expected**: After sign-in, nav bar shows `<UserButton>` with avatar.

### Scenario 3: Google OAuth Sign-In

```bash
# 1. Click profile icon → Clerk modal appears
# 2. Click "Continue with Google"
# 3. Complete Google OAuth flow
# 4. Verify you return authenticated
```

**Expected**: After Google OAuth, nav bar shows `<UserButton>`.

### Scenario 4: Sign-Out

```bash
# 1. While signed in, click UserButton (your avatar)
# 2. Click "Sign out" in the dropdown
# 3. Verify nav bar reverts to showing the generic User icon
```

**Expected**: After sign-out, nav bar shows `<SignInButton>` (user icon).

### Scenario 5: Session Persistence

```bash
# 1. Sign in
# 2. Navigate to 3+ different pages (home → category → product)
# 3. Verify UserButton remains visible on every page
# 4. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
# 5. Verify you're still signed in
```

**Expected**: Auth state persists across navigation and refresh.

### Scenario 6: Error Handling (Clerk Unavailable)

```bash
# 1. Block clerk.accounts.dev in browser DevTools (or use offline mode)
# 2. Click profile icon
# 3. Verify error message "Sign in unavailable" is shown (not a blank page or crash)
```

**Expected**: Graceful error message, page continues to function.

## Automated Tests

```bash
# Run integration tests (nav bar auth states)
npm test -- components/__tests__/nav-bar.test.tsx

# Run full test suite
npm test

# Run static checks
tsc --noEmit && npm run lint
```

## Gherkin Coverage

See [features/clerk-sign-in.feature](./features/clerk-sign-in.feature) for all 9 scenarios.

Each `@US{N}` scenario must have at least one corresponding integration test.
