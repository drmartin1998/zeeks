# Research: Guest Loyalty Prompt on Checkout

**Feature**: 029-guest-loyalty-prompt
**Date**: 2026-08-06

## Research Topics

### 1. How to allow guest access to the checkout page

**Decision**: Modify `app/checkout/page.tsx` to branch on `auth()` result instead of redirecting.

**Rationale**: The checkout page (`app/checkout/page.tsx`) currently does `const { userId } = await auth()` and redirects to `/sign-in` if `userId` is null. The cart page (`app/cart/page.tsx`) already demonstrates the dual auth/guest pattern — it branches on `userId` to use either Square customer ID or cookie-based `guestOrderId`. We apply the same pattern to the checkout page.

**Alternatives considered**:
- Separate `/checkout/guest` route — unnecessary duplication; the checkout page is the same layout for both paths
- Middleware-level guest detection — adds complexity with no benefit; page-level branching is the established pattern in this codebase

**Implementation approach**:
1. When `!userId`: fetch guest cart via `getCart(guestOrderId)` from cookie, skip loyalty/profile fetches, pass `isGuest: true`
2. When `userId`: existing behavior — get `squareCustomerId`, fetch cart + loyalty + profile, pass `isGuest: false`
3. `CheckoutPageClient` receives an `isGuest` prop and conditionally renders `GuestLoyaltyNotification`

---

### 2. How to conditionally render the loyalty notification server-side

**Decision**: Create a Server Component (`GuestLoyaltyNotification`) that returns `null` when conditions are not met.

**Rationale**: Constitution I (Server Components First) requires server-side data decisions. The existing `EarnedPointsNotice` component (`components/cart/earned-points-notice.tsx`) demonstrates the exact pattern — an RSC that checks conditions server-side and returns `null` if unmet. This avoids client-side flicker (notification appears then hides after hydration) and keeps a11y announcement clean.

**Alternatives considered**:
- Client component with `useEffect` — violates Constitution I, causes layout shift and hydration flicker
- Server Action to determine visibility — adds unnecessary network round-trip; conditions are all available at render time

**Conditions that cause `null` return**:
1. `isGuest` is `false` (authenticated customer — per FR-008)
2. `!isLoyaltyConfigured()` (per FR-006)
3. Loyalty API unreachable or slow (per FR-007 — check with timeout, never block page render)
4. Dismissed by guest in current session (checked via client-side `sessionStorage` on the dismiss button component)

---

### 3. How the loyalty API reachability check works without blocking page render

**Decision**: Use a `Promise.race` with a short timeout (300ms) around `isLoyaltyConfigured()`. If the env var check passes but the actual Square API call to verify program accessibility takes longer than 300ms, return `null` (notification hidden) and let the page render immediately.

**Rationale**: Per clarification Q1 from spec, the checkout page must not delay its render waiting for the loyalty API. The env var check (`isLoyaltyConfigured()`) is synchronous and instantaneous. If the loyalty API is unreachable, the existing implementation already handles timeouts via `withRetry()` in `lib/utils.ts`. Rather than blocking the entire checkout page render on a non-essential notification, we use a short circuit.

**Alternatives considered**:
- Streaming with `<Suspense>` — adds complexity and the notification is too small to justify a separate suspense boundary
- Always showing the notification regardless of API state — risks broken incentive path (guest signs up but loyalty program is down)
- Background fetch after page load — violates FR-012 (notification should be in initial HTML)

**Implementation**: The notification visibility check is `isLoyaltyConfigured() && (await checkLoyaltyApiAccessible(300))`. If either fails, return `null`. The `checkLoyaltyApiAccessible` wraps a lightweight Square loyalty API call (e.g., `searchLoyaltyAccount` with limit 1) with a short timeout.

---

### 4. How notification dismissal persists per browser session

**Decision**: Use `sessionStorage` with a key like `guest-loyalty-notification-dismissed`.

**Rationale**: Per spec Assumptions, "notification dismissal state is stored in the browser session." `sessionStorage` is the standard browser API for session-scoped persistence — it clears when the browser tab/window closes, and is distinct from `localStorage` (persistent) and cookies (sent with every request). The dismiss button is a `"use client"` wrapper that reads/writes `sessionStorage`.

**Alternatives considered**:
- Cookie (`Set-Cookie` header) — requires HTTP response on every page load, overkill for a UI toggle
- `localStorage` — persists beyond session, which violates FR-005 (dismissal must reset after session)
- Server-side session — requires a database for a non-critical toggle; adds latency and complexity

**Implementation**: 
- `GuestLoyaltyNotification` renders a `DismissButton` client component as a leaf node
- `DismissButton` checks `sessionStorage.getItem('guest-loyalty-notification-dismissed')` on mount
- If `true`, calls `onDismiss()` callback (parent hides notification via state)
- On click, sets `sessionStorage.setItem('guest-loyalty-notification-dismissed', 'true')` and calls `onDismiss()`

---

### 5. How the `return_to` query parameter works for Register and Sign In

**Decision**: Append `?return_to=/checkout` to the Register and Sign In links in the notification. Modify `app/sign-in/page.tsx` and `app/sign-up/page.tsx` to read `searchParams.return_to` and redirect there after authentication instead of the hardcoded `/`.

**Rationale**: Per clarification Q3, the notification links must include an explicit `return_to` parameter. The existing `AuthGuard` component in `app/sign-in/page.tsx` and `app/sign-up/page.tsx` redirects to `/` (home) after detecting the user is already signed in or after successful auth. The `SignInForm` and `SignUpForm` components need to read `return_to` from `searchParams` and use it as the redirect target.

**Alternatives considered**:
- Clerk `afterSignInUrl` / `afterSignUpUrl` — these are static per-environment; cannot vary per-link
- Cookie-based return URL — adds complexity; query parameter is simpler and more transparent

**Implementation**:
- Notification renders: `<Link href="/sign-up?return_to=/checkout">Register</Link>` and `<Link href="/sign-in?return_to=/checkout">Sign In</Link>`
- `app/sign-in/page.tsx`: `export default async function SignInPage({ searchParams }: { searchParams: Promise<{ return_to?: string }> }) { const params = await searchParams; return <SignInForm returnTo={params.return_to ?? "/"} />; }`
- `app/sign-up/page.tsx`: Same pattern
- `SignInForm` / `SignUpForm`: Pass `returnTo` to Clerk's `redirectUrl` or to the `afterSignInUrl`/`afterSignUpUrl` prop on `<SignIn />` / `<SignUp />`

---

### 6. Accessibility: screen reader live region and keyboard dismiss

**Decision**: Use `role="status"` on the notification container and a `<button>` element for the dismiss action.

**Rationale**: Per clarification Q2 (both keyboard + screen reader) and FR-014. `role="status"` is a live region that announces content changes to screen readers without interrupting the user's current activity. A `<button>` with visible text (e.g., "Dismiss" or an `aria-label="Dismiss loyalty notification"` on an icon button) is natively keyboard-operable (Tab to focus, Enter/Space to activate).

**Alternatives considered**:
- `role="alert"` — interrupts the user, which is too aggressive for a non-critical notification
- `<div>` with `onClick` — not keyboard-accessible without adding `tabIndex` and `onKeyDown`, violates WCAG

**Implementation**:
- `GuestLoyaltyNotification` root wrapper: `<div role="status" aria-label="Loyalty program notification">`
- Dismiss button: `<button aria-label="Dismiss loyalty notification" onClick={handleDismiss}>` with a close/X icon
- Color contrast: Notification background and text must meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
- Focus management: After dismiss, focus moves to the next focusable element (natural browser behavior with button removal)

---

### 7. Guest payment flow: how guests pay on the checkout page

**Decision**: The `processPayment` Server Action in `app/cart/actions.ts` already supports guest paths — it reads the guest cart order ID from cookies when `userId` is null. No changes needed for guest payment processing.

**Rationale**: Research confirmed `processPayment` (line 499 of `app/cart/actions.ts`) has a `const { userId } = await auth()` check and branches into auth path (get `squareCustomerId`) or guest path (read `guestOrderId` from cookie). The guest checkout through the custom payment page is already functional once the checkout page allows guest access.

**Alternatives considered**: None — the guest path already exists and was verified in the codebase.

---

### 8. Cart preservation through the auth transition

**Decision**: Cart transfer on sign-in is already implemented in `lib/square/cart-transfer.ts` via `transferGuestCartToCustomer()`. The cart page (`app/cart/page.tsx`) triggers this when a guest signs in. For the checkout page flow, the same mechanism applies — after registering/signing in via `return_to=/checkout`, the checkout page loads fresh as an authenticated page, detects the transferred cart, and renders the authenticated checkout experience.

**Rationale**: Per spec FR-011, guest cart must transfer on auth. This is already an established capability. No new implementation needed — the checkout page's existing auth path will pick up the transferred cart on the next page load.

**Alternatives considered**: Pre-emptive cart transfer before navigation — adds complexity; the existing on-load transfer works correctly.

---

## Summary of Decisions

| # | Topic | Decision | Implementation Impact |
|---|-------|----------|----------------------|
| 1 | Guest checkout page access | Modify `app/checkout/page.tsx` to branch on `auth()` | 1 file modified |
| 2 | Server-side notification visibility | RSC pattern (like `EarnedPointsNotice`) | 1 new component |
| 3 | Loyalty API timeout | 300ms short-circuit, return `null` if slow | New inline helper |
| 4 | Dismissal persistence | `sessionStorage` via `"use client"` DismissButton | Leaf client component |
| 5 | `return_to` parameter | Query param on Register/Sign In links + modify auth pages | 2 files modified |
| 6 | Accessibility | `role="status"` + `<button>` dismiss | Built into notification component |
| 7 | Guest payment flow | No changes needed — already works | 0 files modified |
| 8 | Cart preservation on auth | No changes needed — already works via `cart-transfer.ts` | 0 files modified |
