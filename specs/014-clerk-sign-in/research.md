# Research: Clerk Sign-In from Profile Icon

**Feature**: 014-clerk-sign-in | **Date**: 2026-08-02

## 1. Clerk Frontend SDK Choice

**Decision**: Install `@clerk/nextjs` v7+ (Core 3) for frontend auth UI components.

**Rationale**:
- The project already uses `@clerk/backend` v1 for webhook handling (specs 008/013)
- `@clerk/nextjs` provides `<ClerkProvider>`, `<SignInButton>`, `<UserButton>`, and `<Show>` components
- v7 (Core 3) is the latest and required for Next.js 16 compat — the project runs Next.js 16.2.10
- Core 3 uses `<Show when="signed-in">` / `<Show when="signed-out">` instead of deprecated `<SignedIn>`/`<SignedOut>`
- ClerkProvider in Next.js auto-reads `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — no explicit prop needed

**Alternatives considered**:
- `@clerk/nextjs` v6: Rejected — targets Next.js 14/15; v7 is needed for Next.js 16 compatibility
- Custom auth UI using Clerk's headless components: Rejected — spec explicitly chooses Clerk's pre-built UI for minimal implementation
- `@clerk/clerk-react` (framework-agnostic): Rejected — `@clerk/nextjs` is the documented path for Next.js App Router with SSR support

## 2. ClerkProvider Placement

**Decision**: Place `<ClerkProvider>` inside `<body>` in `app/layout.tsx`.

**Rationale**:
- Clerk Core 3 docs: For Next.js 16 with cache components, ClerkProvider must be inside `<body>`, not wrapping `<html>`
- This prevents "Uncached data was accessed outside of `<Suspense>`" errors
- The existing `app/layout.tsx` has `<body className="...">{children}</body>` — ClerkProvider wraps children inside body

**Alternatives considered**:
- Wrapping `<html>`: Rejected — causes errors in Next.js 16
- Only wrapping specific pages: Rejected — would require per-page ClerkProvider setup, defeating session persistence

## 3. Nav Bar Auth UI Pattern

**Decision**: Use `<SignInButton mode="modal">` for unauthenticated state and `<UserButton>` for authenticated state, wrapped in `<Show>` conditionals.

**Rationale**:
- `<SignInButton mode="modal">` triggers Clerk's modal sign-in/sign-up UI on the current page — no redirect needed
- `<UserButton>` shows the user's avatar and provides a dropdown with sign-out — covers FR-004 and FR-005
- `<Show when="signed-in">` / `<Show when="signed-out">` handles conditional rendering (Core 3 pattern)
- Both components are pre-built, accessible (keyboard-navigable), and match Clerk's design system
- The loading spinner (FR-003a) is handled by Clerk's built-in loading state in the modal

**Alternatives considered**:
- Custom `<button>` + `<ClerkModal>`: Rejected — reinvents Clerk's pre-built components, adds maintenance burden
- Redirect mode (`mode="redirect"`): Rejected — spec requires returning to current page after auth, modal achieves this natively
- Separate sign-in and sign-up buttons: Rejected — Clerk's modal combines both in one interface

## 4. Loading State Implementation

**Decision**: Clerk's `<SignInButton>` provides built-in loading behavior; no custom spinner needed at the component level.

**Rationale**:
- Clerk's modal opens near-instantly (client-side render) — the 2-second SC-005 target covers worst-case network/CDN loading
- Clerk handles its own loading state within the modal UI
- The profile icon transitions immediately from `<SignInButton>` (user icon) to Clerk's modal overlay
- If additional loading feedback is desired, Clerk's `appearance` prop can customize loading states

**Alternatives considered**:
- Custom spinner state in NavBar: Rejected — adds unnecessary state management when Clerk handles this natively

## 5. Environment Variables

**Decision**: Use two env vars: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.

**Rationale**:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Client-safe, auto-read by ClerkProvider in Next.js
- `CLERK_SECRET_KEY`: Server-only, already used by `@clerk/backend` (existing webhook pipeline)
- Clerk Dashboard provides both keys under "API Keys"
- No additional env config needed — Clerk uses defaults for sign-in/sign-up URLs

**Alternatives considered**:
- Custom sign-in/sign-up URL paths: Rejected — modal mode doesn't need custom routes; spec says no route protection in v1
