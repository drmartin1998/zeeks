# Quickstart: Guest Loyalty Prompt on Checkout

**Feature**: 029-guest-loyalty-prompt
**Date**: 2026-08-06

## Prerequisites

- Dev server running: `vercel dev` on port 3000
- Square sandbox credentials configured (`.env.local` with `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_APPLICATION_ID`, `SQUARE_LOYALTY_PROGRAM_ID`)
- Clerk dev instance configured
- Test product catalog available in Square sandbox

## Validation Scenarios

The Gherkin `.feature` file at `features/guest-loyalty-prompt.feature` defines 11 scenarios. Below are manual validation steps grouped by user story.

---

### US1: Guest Sees Loyalty Prompt on Checkout

**Prerequisite**: Loyalty program configured (`SQUARE_LOYALTY_PROGRAM_ID` set in `.env.local`)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1.1 | Open the store in an incognito/private window (no Clerk session) | Store loads as guest |
| 1.2 | Browse a product and add to cart | Cart badge updates; item added |
| 1.3 | Navigate to `/cart` | Cart page shows item with "Proceed to Checkout" button |
| 1.4 | Click "Proceed to Checkout" | Navigated to `/checkout`. **Loyalty notification banner visible** with message about earning points/redeeming rewards, and "Register" + "Sign In" buttons. |
| 1.5 | Verify notification does not block payment | Payment form (card input) is visible and usable below/alongside notification |
| 1.6 | Click dismiss (X/close) button on notification | Notification disappears from the checkout page |
| 1.7 | Navigate to `/cart` then back to `/checkout` | Notification remains hidden (dismissed for session) |
| 1.8 | Close incognito window, reopen, repeat steps 1.1-1.4 | Notification is visible again (new session) |

**Expected pass**: Steps 1.4, 1.5, 1.6, 1.7, 1.8 all succeed.

---

### US2: Guest Clicks "Register"

| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.1 | As a guest on `/checkout` with notification visible, click "Register" | Navigated to `/sign-up?return_to=/checkout` |
| 2.2 | Complete registration form (name, email, password) | After registration, redirected back to `/checkout` |
| 2.3 | Verify authenticated checkout experience | Notification is gone. Cart items preserved. Now see authenticated checkout (customer info, loyalty panel if applicable). |
| 2.4 | From checkout page, click "Register" but navigate back before completing | Return to `/checkout` as guest. Notification still visible. Cart intact. |

**Expected pass**: Steps 2.1-2.4 all succeed. Cart items survive the round-trip.

---

### US3: Guest Clicks "Sign In"

| Step | Action | Expected Result |
|------|--------|-----------------|
| 3.1 | As a guest on `/checkout` with notification visible, click "Sign In" | Navigated to `/sign-in?return_to=/checkout` |
| 3.2 | Sign in with an existing test account that has loyalty points | After sign-in, redirected back to `/checkout` |
| 3.3 | Verify authenticated checkout experience | Notification is gone. Cart items transferred (merged if existing cart). Loyalty info visible. |
| 3.4 | Sign out, browse as guest, go to checkout, verify notification | Notification visible for unauthenticated session |

**Expected pass**: Steps 3.1-3.4 all succeed.

---

### Edge Case Validations

| Step | Action | Expected Result |
|------|--------|-----------------|
| E1 | Disable loyalty: Remove `SQUARE_LOYALTY_PROGRAM_ID` from `.env.local`, restart server. Browse as guest, go to checkout. | Notification is NOT displayed. Checkout functions normally. |
| E2 | Re-enable loyalty, but simulate API failure. Browse as guest, go to checkout. | Notification is NOT displayed (API unreachable). Checkout functions normally. |
| E3 | Browse as guest with empty cart, navigate directly to `/checkout` | Redirected to `/cart` with "empty cart" message. Notification never considered. |
| E4 | Sign in normally (not via notification), go to `/checkout` | Authenticated checkout experience. Notification NOT displayed. |
| E5 | On a mobile viewport (375px), view checkout with notification | Notification renders correctly, remains dismissible, does not overlap payment form. |

**Expected pass**: All edge cases handle gracefully without errors.

---

## Test Commands

After implementation, run:

```bash
# Static checks
tsc --noEmit
npm run lint

# Unit + Integration tests (new components)
npm test -- --reporter=verbose

# E2E (requires dev server running)
npm run test:e2e
```

## Success Criteria Mapping

| Criteria | Validation Method |
|----------|-------------------|
| SC-001: 100% of guests see notification | Steps 1.1-1.4 |
| SC-002: Notification doesn't block payment | Step 1.5 |
| SC-003: Dismissed notification stays hidden | Steps 1.6-1.7 |
| SC-004: Auth customers never see notification | Step E4 |
| SC-005: No notification when loyalty unavailable | Steps E1, E2 |
| SC-006: Cart survives auth round-trip | Steps 2.2, 3.2 |
