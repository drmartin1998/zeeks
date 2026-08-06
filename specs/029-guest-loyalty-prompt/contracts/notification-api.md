# Contract: Guest Loyalty Notification API

**Feature**: 029-guest-loyalty-prompt
**Date**: 2026-08-06

## Component Contract

### `GuestLoyaltyNotification`

**Type**: React Server Component (RSC) — async, no `"use client"` directive

**File**: `components/checkout/guest-loyalty-notification.tsx`

**Props**:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isGuest` | `boolean` | Yes | Whether the current visitor is unauthenticated |
| `cartIsNonEmpty` | `boolean` | Yes | Whether the cart has at least one line item |
| `checkoutPath` | `string` | Yes | The checkout page path for `return_to` query parameter (e.g., `"/checkout"`) |

**Returns**: `JSX.Element | null`

Returns `null` (renders nothing) when:
- `isGuest` is `false`
- `!isLoyaltyConfigured()` (reads `SQUARE_LOYALTY_PROGRAM_ID` env var)
- Loyalty API is unreachable or slow (>300ms timeout)
- Guest has dismissed the notification in current session (`sessionStorage` key present)

**Rendered Output** (when visible):

```html
<div role="status" aria-label="Loyalty program notification">
  <!-- Notification content -->
  <p>Earn points and redeem rewards!</p>
  <p>Register or sign in to start accumulating loyalty points on your purchases and to redeem existing rewards.</p>
  <a href="/sign-up?return_to=/checkout">Register</a>
  <a href="/sign-in?return_to=/checkout">Sign In</a>
  <button aria-label="Dismiss loyalty notification"><CloseIcon /></button>
</div>
```

**Accessibility Requirements** (per FR-014):
- Container: `role="status"` — live region that announces when it appears
- Dismiss button: `<button>` with `aria-label="Dismiss loyalty notification"` — keyboard-operable (Tab + Enter/Space)
- Color contrast: meets WCAG AA (4.5:1 for text, 3:1 for large text)

**Styling** (per FR-013):
- Responsive at 375px, 768px, 1280px viewport widths
- Non-blocking — sits above or alongside the order summary, does not overlap or cover payment form
- Uses the loyalty color palette consistent with `EarnedPointsNotice` (orange/amber accent, light warm background)

### `DismissButton`

**Type**: Client Component (`"use client"`) — leaf node for `sessionStorage` interaction

**File**: Co-located in `guest-loyalty-notification.tsx` or separate `components/checkout/dismiss-button.tsx`

**Props**: None (uses `onDismiss` callback from parent)

**Behavior**:
1. On mount: reads `sessionStorage.getItem('guest-loyalty-notification-dismissed')`
2. If key exists: calls `onDismiss()` immediately → parent sets state to hide notification
3. On click: sets `sessionStorage.setItem('guest-loyalty-notification-dismissed', 'true')` → calls `onDismiss()`

---

## Page Contract Changes

### `app/checkout/page.tsx` — Guest Access

**Current behavior**: Redirects to `/sign-in` when `!userId`
**New behavior**: Branches into guest path when `!userId`

```typescript
const { userId } = await auth();

if (!userId) {
  // Guest checkout path
  const guestOrderId = getGuestCartOrderId();
  if (!guestOrderId) redirect("/cart");

  const cart = await getCart(guestOrderId);
  if (!cart || cart.lineItems.length === 0) redirect("/cart");

  return <CheckoutPageClient checkoutData={{ cart, ... }} isGuest={true} />;
}

// Existing authenticated path continues unchanged...
```

### `app/sign-in/page.tsx` — `return_to` Support

**Current behavior**: `AuthGuard` redirects signed-in users to `/`
**New behavior**: Reads `searchParams.return_to`, passes to `SignInForm` as redirect target

```typescript
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>;
}) {
  const { return_to } = await searchParams;
  // return_to passed to SignInForm → Clerk afterSignInUrl or redirectUrl
}
```

### `app/sign-up/page.tsx` — `return_to` Support

Same pattern as sign-in.

---

## Cart Transfer Contract (No Changes)

The existing `transferGuestCartToCustomer()` in `lib/square/cart-transfer.ts` handles guest-to-auth cart transfer on sign-in. This is triggered by the cart page on page load when a previously-guest session gains auth. The checkout page benefits from this indirectly — after sign-in via `return_to=/checkout`, the cart has already been transferred and the checkout page loads the authenticated cart.

**Contract**:
```typescript
export async function transferGuestCartToCustomer(
  guestOrderId: string,
  squareCustomerId: string
): Promise<string> // Returns the customer's draft order ID (existing or merged)
```

No changes needed to this contract for spec 029.
