# Implementation Plan: Custom Login & Sign-Up Forms

**Branch**: `017-custom-auth-forms` | **Date**: 2026-08-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-custom-auth-forms/spec.md`

## Summary

Replace the existing Clerk modal sign-in (triggered by `<SignInButton mode="modal">` in the nav bar) with custom branded sign-in and sign-up pages. A dropdown menu on the profile icon provides "Login" and "Sign Up" options that navigate to `/sign-in` and `/sign-up`. Both pages are client components using Clerk's `useSignIn()` and `useSignUp()` hooks to drive custom `<form>` UIs. The sign-in form has email + password; the sign-up form has first name, last name, email, phone, password, and verify password — all with inline validation. After authentication, users are redirected back to their previous page.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 16.2.10, React 19.2.4

**Primary Dependencies**: `@clerk/nextjs` v7.6.4 (existing — `useSignIn()`, `useSignUp()`, `useAuth()`, `UserButton`), `lucide-react` (existing — icons), shadcn/ui (existing — Button, Input components)

**Storage**: Clerk-hosted (user profiles, sessions). No new database storage.

**Testing**: Vitest + @testing-library/react + MSW (integration), Playwright (E2E for sign-in/sign-up flow)

**Target Platform**: Vercel (Next.js App Router), modern browsers

**Project Type**: Web application (Next.js eCommerce frontend)

**Performance Goals**: Dropdown renders in <100ms; sign-in submission to authenticated state in <2s (SC-002); sign-up submission to authenticated state in <5s (SC-002)

**Constraints**: All forms are client components (`"use client"`) since they use Clerk hooks. Forms use native `<form>` with `onSubmit` handlers (Constitution V — progressive enhancement baseline). Clerk API calls never expose secrets to browser (Constitution II).

**Scale/Scope**: 2 new pages, 1 nav-bar modification, 3 new components, ClerkProvider config update. 3 user stories, 13 functional requirements, 16 Gherkin scenarios.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | ⚠️ MINOR | Sign-in and sign-up pages must be `"use client"` — `useSignIn()`/`useSignUp()` are client-only hooks. This is unavoidable for Clerk custom forms. The pages remain at leaf nodes. |
| II | API Route Security | ✅ PASS | Clerk handles auth server-side. No Square API calls from these pages. Clerk publishable key is the only browser-exposed key (by design). |
| III | Type-Safe Data Flow | ✅ PASS | `@clerk/nextjs` provides TypeScript types for `useSignIn()`, `useSignUp()`. Form state and field errors are typed. `@/*` imports only. |
| IV | Vercel-Native Performance | ✅ PASS | Forms are lightweight client components. Clerk's JS bundle is CDN-hosted and lazy-loaded. No impact on static/ISR pages. |
| V | Progressive Enhancement | ⚠️ MINOR | Custom forms require JavaScript — `useSignIn()`/`useSignUp()` are React hooks. Core shopping flow (browse → view product) remains JS-optional. Auth forms are inherently interactive. |
| VI | Gherkin-First Testing (Testing Trophy) | ✅ PASS | 16 Gherkin scenarios in `.feature` file. Integration tests (RTL + MSW) for form components. E2E tests (Playwright) for sign-in/sign-up journeys. |
| VII | No Mock Data Fallback | ✅ PASS | No mock data involved. Clerk handles all auth natively. No Square data on these pages. |

**Gate Result**: PASS — all principles satisfied. Two minor notes on Principles I and V (client components + JS dependency) — both inherent to any custom Clerk auth UI.

## Project Structure

### Documentation (this feature)

```text
specs/017-custom-auth-forms/
├── plan.md              # This file
├── spec.md              # Feature specification
├── features/
│   └── custom-auth-forms.feature  # Gherkin scenarios
├── checklists/
│   └── requirements.md  # Quality checklist (to be created)
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (files to create/modify)

```text
app/
├── layout.tsx                       # MODIFY — add signInUrl/signUpUrl to ClerkProvider
├── sign-in/
│   ├── page.tsx                     # NEW — sign-in form page
│   └── __tests__/
│       └── page.test.tsx            # NEW — integration tests
├── sign-up/
│   ├── page.tsx                     # NEW — sign-up form page
│   └── __tests__/
│       └── page.test.tsx            # NEW — integration tests

components/
├── nav-bar.tsx                      # MODIFY — replace SignInButton modal with dropdown
├── __tests__/
│   └── nav-bar.test.tsx             # MODIFY — update auth UI tests
├── auth/
│   ├── auth-dropdown.tsx            # NEW — profile icon dropdown (login/sign-up)
│   ├── sign-in-form.tsx             # NEW — email + password sign-in form
│   ├── sign-up-form.tsx             # NEW — 6-field sign-up form
│   └── __tests__/
│       ├── auth-dropdown.test.tsx   # NEW
│       ├── sign-in-form.test.tsx    # NEW
│       └── sign-up-form.test.tsx    # NEW

middleware.ts                        # (unchanged — /sign-in and /sign-up are public)

.env.local                           # ADD: NEXT_PUBLIC_CLERK_SIGN_IN_URL, SIGN_UP_URL
```

**Structure Decision**: Form logic is extracted to standalone components (`sign-in-form.tsx`, `sign-up-form.tsx`) so they can be tested in isolation. The pages at `/sign-in/page.tsx` and `/sign-up/page.tsx` are thin wrappers that compose the form components with the site layout (NavBar + Footer). The dropdown is a client component that replaces the inline Clerk button rendering in `nav-bar.tsx`.

## Complexity Tracking

> Two minor constitution notes (Principles I & V) — both inherent to Clerk custom forms. No violations requiring justification.

## Data Flow

```
Unauthenticated Visitor
    │
    ├── Clicks profile icon → AuthDropdown opens
    │       ├── "Login" → navigate /sign-in → SignInForm
    │       └── "Sign Up" → navigate /sign-up → SignUpForm
    │
    ├── SignInForm
    │       ├── Client-side validation (email required, password required)
    │       ├── useSignIn().signIn.create({ identifier: email, password })
    │       ├── Clerk API success → setActive({ session }) → redirect back
    │       └── Clerk API error → display banner error
    │
    └── SignUpForm
            ├── Client-side validation (all 6 fields, password match, phone E.164)
            ├── useSignUp().signUp.create({ firstName, lastName, emailAddress, phoneNumber, password })
            ├── useSignUp().signUp.prepareEmailAddressVerification() if needed
            ├── Clerk API success → setActive({ session }) → redirect back
            └── Clerk API error → display banner error
```
