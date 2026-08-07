# Quickstart: Password Gate Redesign

**Feature**: 033-password-gate-redesign
**Date**: 2026-08-07

## Prerequisites

- [ ] Dev server running (`vercel dev` on port 3000; check `lsof -ti:3000` first, reuse if already running)
- [ ] `SITE_PASSWORD` configured in `.env.local`
- [ ] TypeScript compiles cleanly: `tsc --noEmit`
- [ ] Lint passes: `npm run lint`

## Validation Scenarios

### VS-1: The new password gate page renders

1. Clear the `site_password` cookie (or use an incognito window).
2. Navigate to `http://localhost:3000/`.
3. **Expected**: You are redirected to `/password?returnTo=/` showing the new dark-themed gate page with the Zeeks logo, "SOMETHING EPIC IS COMING" headline, the password form, and the footer with launch info + social links.

### VS-2: Incorrect password shows an error

1. On the password gate page, enter an incorrect password and submit.
2. **Expected**: An error message is shown and access is not granted (you stay on the gate).

### VS-3: Correct password grants access and redirects

1. On the password gate page, enter the correct `SITE_PASSWORD` and submit.
2. **Expected**: You are redirected to the original destination (`/` or the `returnTo` path).

### VS-4: The password cookie expires in 24 hours

1. After a successful login, inspect the `site_password` cookie in the browser's dev tools.
2. **Expected**: The cookie's expiration is ~24 hours from the time of entry (not 7 days).

### VS-5: Expired cookie requires re-entry

1. After the cookie expires (or after clearing it), navigate to a protected page.
2. **Expected**: You are redirected to the password gate again.

### VS-6: Responsive layout

1. View the password gate page at desktop and mobile widths.
2. **Expected**: The page stays centered and usable (no broken layout).

## Automated Tests

- **Unit**: `npm test` — a test for the password API confirming the cookie `maxAge` is 24 hours (86400).
- **Integration**: `npm test` — a component test for the password gate page confirming it renders the new layout (headline, form, button, footer) and handles incorrect/correct password flows.

## Definition of Done

- `tsc --noEmit` passes; `npm run lint` passes with zero errors.
- The new password gate page matches the Figma layout (VS-1).
- Password validation and `returnTo` redirect work (VS-2, VS-3).
- The cookie expires in 24 hours (VS-4).
- Responsive layout works (VS-6).
- Every `@US{N}` scenario in `features/password-gate-redesign.feature` is satisfied.