# Implementation Plan: Edit Profile Page

**Branch**: `020-edit-profile` | **Date**: 2026-08-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/020-edit-profile/spec.md`

## Summary

Implement a new edit profile page at `/account/edit` that allows customers to update their personal information, shipping address, and password. The page fetches current profile data from Square (the authoritative source) on load, pre-populates the form, and writes changes back to Square first before syncing to Clerk. Password changes are handled exclusively through Clerk. The system implements retry logic for both Square and Clerk API calls, and handles mismatch scenarios by always preferring Square's data.

## Technical Context

- Language/Version: TypeScript 5.x strict, Next.js 16.x (App Router), React 19.x (RSC + Client Components)
- Primary Dependencies: Square SDK v45, Clerk (`@clerk/nextjs` v7, `@clerk/backend` v1), react-hook-form v7, zod v3, shadcn/ui (@base-ui/react), Lucide icons
- Storage: N/A (Square Customer API + Clerk User API for persistence)
- Testing: Vitest + React Testing Library + MSW (integration), tsc + ESLint (static)
- Target Platform: Vercel (production), modern browsers
- Project Type: Web application (Next.js App Router)
- Performance Goals: Form pre-population within 3s, save operation within 5s
- Constraints: Must retry Square API up to 2x, Clerk sync up to 3x with exponential backoff
- Scale/Scope: 1 new page, 1 new API route handler, 2-3 new service functions, 2-3 new client components, ~5 test files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | **PASS** | Page is an async RSC that fetches Square data server-side. Form is a Client Component leaf node with `"use client"`. |
| II | API Route Security | **PASS** | Square API calls through Route Handlers (`/api/account/profile`); tokens never exposed to browser; Zod input validation on all endpoints. Clerk API calls use server-side SDK only. |
| III | Type-Safe Data Flow | **PASS** | TypeScript strict mode; explicit interfaces in `lib/square/types.ts`; `@/*` imports only; Zod schemas for form validation and API inputs. |
| IV | Vercel-Native Performance | **PASS** | `next/image`, `next/font`; server-side data fetching; client form with local state (no unnecessary re-fetches). |
| V | Progressive Enhancement | **PASS** | Core profile editing requires JS (form interaction). Cancel link and page navigation work without JS. |
| VI | Gherkin-First Testing (Testing Trophy) | **PASS** | .feature file exists with 16 scenarios covering all 3 user stories + edge cases. Integration tests with RTL+MSW for form submission, retry logic, error states. Unit tests for retry utility, Zod schemas. |
| VII | Environment-Driven Configuration | **PASS** | All config via env vars (SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, CLERK_SECRET_KEY), validated in `lib/env.ts`. No new env vars needed. |

## Project Structure

### Documentation (this feature)

```
specs/020-edit-profile/
├── spec.md
├── plan.md
├── features/
│   └── edit-profile.feature
└── checklists/
    └── requirements.md
```

### Source Code (files to create/modify)

```
app/
├── account/
│   ├── page.tsx                          # MODIFY: Add Edit Profile button link
│   └── edit/
│       ├── page.tsx                      # NEW: Server Component page
│       ├── edit-profile-form.tsx         # NEW: Client Component form
│       └── __tests__/
│           ├── page.test.tsx             # NEW: Page integration tests
│           └── edit-profile-form.test.tsx # NEW: Form integration tests
├── api/
│   └── account/
│       └── profile/
│           ├── route.ts                  # NEW: GET/PUT profile API
│           └── __tests__/
│               └── route.test.ts         # NEW: API route tests

components/
└── account/
    ├── profile-header-card.tsx           # MODIFY: Wire Edit Profile button to /account/edit
    └── __tests__/
        └── profile-header-card.test.tsx  # NEW: Card tests

lib/
├── square/
│   ├── customers.ts                      # MODIFY: Add updateCustomer function
│   ├── profile.ts                        # NEW: Profile sync service
│   └── __tests__/
│       ├── customers.test.ts             # MODIFY: Add updateCustomer tests
│       └── profile.test.ts              # NEW: Profile sync tests
├── clerk/
│   ├── sync.ts                           # NEW: Clerk sync utilities
│   └── __tests__/
│       └── sync.test.ts                  # NEW: Clerk sync tests
└── utils/
    └── retry.ts                          # NEW: Generic retry utility
    └── __tests__/
        └── retry.test.ts                 # NEW: Retry utility tests
```

## Complexity Tracking

No constitution violations. This feature follows all 7 principles.

## Data Flow

### Page Load
```
User navigates to /account/edit
  → Server Component: auth() → userId
  → getSquareCustomerId(userId) → squareCustomerId
  → Promise.allSettled([
      fetchSquareCustomer(squareCustomerId) → Square Customer with profile + address,
      fetchClerkUser(userId) → Clerk User with profile
    ])
  → If Square fails: show full-page error with retry
  → If Clerk fails: show non-blocking banner, use Square data only
  → Compare Square vs Clerk profile fields (name, email, phone)
  → If mismatch: silently sync Clerk ← Square (background, non-blocking)
  → Pass profile data as props to EditProfileForm (Client Component)
```

### Form Submission (Save Changes)
```
User clicks "Save Changes"
  → Client-side validation (Zod schema + react-hook-form)
  → Determine which sections changed (dirty field tracking)

  SECTION 1: Personal Information (if dirty)
    → retry(2, () => squareUpdateCustomer(squareCustomerId, { givenName, familyName, email, phone }))
    → retry(3, () => clerkSyncUser(userId, { firstName, lastName, email, phone }))
    → If Clerk retries exhausted: show non-blocking warning

  SECTION 2: Address (if dirty)
    → retry(2, () => squareUpdateCustomer(squareCustomerId, { address }))
    → Address is Square-only; no Clerk sync needed

  SECTION 3: Password (if all fields filled)
    → clerkVerifyPassword(userId, currentPassword)
    → If incorrect: return inline error
    → clerkUpdatePassword(userId, newPassword)

  → Show per-section success/error states
  → On success: reset dirty tracking, update displayed values
```
