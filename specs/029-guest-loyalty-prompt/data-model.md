# Data Model: Guest Loyalty Prompt on Checkout

**Feature**: 029-guest-loyalty-prompt
**Date**: 2026-08-06

## Overview

This feature introduces no new persistent data entities. It is a purely additive UI layer — a notification component rendered on the checkout page under specific conditions. The only transient state is the dismissal flag stored in the browser's `sessionStorage`.

## Transient State

### Notification Dismissal

Stored client-side only. No server-side persistence.

| Field | Type | Storage | Description |
|-------|------|---------|-------------|
| `guest-loyalty-notification-dismissed` | `"true"` or absent | `sessionStorage` | Set when guest dismisses the notification. Cleared when browser session ends. Key is case-sensitive. |

**Lifecycle**:
1. Initial page load: key absent → notification visible
2. Guest clicks dismiss → key set to `"true"` → notification hidden
3. Subsequent page loads in same session: key present → notification remains hidden
4. Browser window/tab closed → `sessionStorage` cleared → notification visible on next fresh session

## Existing Entities (Not Modified)

These entities are used by the notification but not created or modified by this feature:

| Entity | Source | Used By |
|--------|--------|---------|
| **Cart** (guest) | `lib/square/cart.ts` — `getCart(orderId)` with cookie-based `guestOrderId` | Checked to ensure cart is non-empty before showing notification (FR-001) |
| **Loyalty Program** | `lib/square/loyalty.ts` — `isLoyaltyConfigured()` | Checked server-side before rendering notification (FR-006) |
| **Auth State** | Clerk `auth()` — `userId` | Determines `isGuest` boolean (null userId = guest) (FR-001, FR-008) |

## Notification States

The `GuestLoyaltyNotification` component has these visibility states:

| State | Condition | Rendered |
|-------|-----------|----------|
| **Visible** | `isGuest === true` AND cart non-empty AND `isLoyaltyConfigured() === true` AND loyalty API accessible AND not dismissed | Full notification with message + CTAs |
| **Hidden (authenticated)** | `isGuest === false` | `null` (per FR-008) |
| **Hidden (no loyalty)** | `!isLoyaltyConfigured()` | `null` (per FR-006) |
| **Hidden (API issue)** | Loyalty API unreachable or slow | `null` (per FR-007) |
| **Hidden (dismissed)** | `sessionStorage` key present | `null` (per FR-005) |
| **Hidden (empty cart)** | Guest cart is empty | Not applicable — checkout page redirects to `/cart` before notification is considered |

## Component Props

The `GuestLoyaltyNotification` component accepts:

```typescript
interface GuestLoyaltyNotificationProps {
  isGuest: boolean;
  cartIsNonEmpty: boolean;
  checkoutPath: string; // e.g., "/checkout" — used for return_to links
}
```

All visibility decisions are made inside the component based on server-side checks of `isLoyaltyConfigured()` and the loyalty API reachability. The parent (`CheckoutPageClient`) simply passes `isGuest` and renders the notification as a sibling to the order summary.
