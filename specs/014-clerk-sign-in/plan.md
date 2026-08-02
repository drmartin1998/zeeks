# Implementation Plan: Clerk Sign-In from Profile Icon

**Branch**: `014-clerk-sign-in` | **Date**: 2026-08-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-clerk-sign-in/spec.md`

## Summary

Add Clerk authentication UI to the Zeeks frontend by wrapping the app in `<ClerkProvider>`, replacing the static user icon in the nav bar with `<SignInButton mode="modal">` for unauthenticated visitors and `<UserButton>` for signed-in users. The existing Clerk backend pipeline (webhook → Square customer sync from specs 008/013) is reused unchanged. No route protection — all pages remain public.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 16.2.10, React 19.2.4

**Primary Dependencies**: `@clerk/nextjs` (v7+, Core 3), `lucide-react` (existing)

**Storage**: Clerk-hosted (user profiles, sessions). No new database storage.

**Testing**: Vitest + @testing-library/react + MSW (integration), Playwright (E2E)

**Target Platform**: Vercel (Next.js App Router), modern browsers

**Project Type**: Web application (Next.js eCommerce frontend)

**Performance Goals**: Profile icon → Clerk modal opens in <2s (SC-005); auth state reflects within 1s of page load (SC-003)

**Constraints**: ClerkProvider must be inside `<body>` for Next.js 16; no route protection in v1; `<Show>` replaces deprecated `<SignedIn>`/`<SignedOut>` (Clerk Core 3)

**Scale/Scope**: Single nav-bar component change + root layout wrap. 2 files touched, ~50 lines changed.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | ✅ PASS | `NavBar` is already `"use client"` (leaf interactive component). ClerkProvider wraps at root layout (server component). No new `"use client"` directives beyond existing. |
| II | API Route Security (Square) | ✅ PASS | No new Square API calls. Existing webhook pipeline at `/api/webhooks/clerk` is unchanged. |
| III | Type-Safe Data Flow | ✅ PASS | `@clerk/nextjs` provides TypeScript types. No new Square types needed. `@/*` imports used. |
| IV | Vercel-Native Performance | ✅ PASS | Clerk's JS bundle is CDN-hosted and lazy-loaded. No impact on static/ISR pages. |
| V | Progressive Enhancement | ⚠️ MINOR | Clerk modal requires JavaScript — cannot sign in without JS. This is inherent to any client-side auth UI. The core shopping flow (browse → view) remains JS-optional. |
| VI | Gherkin-First Testing (Testing Trophy) | ✅ PASS | `.feature` file exists with 9 scenarios covering all 3 user stories. Integration tests will mock Clerk components. |
| VII | No Mock Data Fallback | ✅ PASS | No mock data involved. Clerk handles auth natively. |

**Gate Result**: PASS — all principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/014-clerk-sign-in/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
├── features/
│   └── clerk-sign-in.feature
└── checklists/
    └── requirements.md
```

### Source Code (files touched)

```text
app/
├── layout.tsx                    # ADD: ClerkProvider wrapper
├── globals.css                   # (unchanged)
└── api/webhooks/clerk/route.ts   # (unchanged — existing pipeline)

components/
├── nav-bar.tsx                   # MODIFY: Replace static User icon with Clerk auth UI
├── __tests__/
│   └── nav-bar.test.tsx          # UPDATE: Add auth state tests

package.json                      # ADD: @clerk/nextjs dependency
```

**Structure Decision**: Single Next.js App Router project. Only 2 source files modified plus 1 test file and 1 new dependency.

## Complexity Tracking

> No constitution violations requiring justification.
