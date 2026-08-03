# Contract: Guest Cart Cookie

**Feature**: 025-guest-checkout
**Type**: Cookie-based session identifier

## Cookie: `guest-cart-order-id`

### Properties

| Property | Value |
|----------|-------|
| Set by | Server Action (`addToCart` for unauthenticated user) |
| Read by | Server Components (`app/cart/page.tsx`), Server Actions (all cart mutations) |
| Cleared by | Server Actions (`initiateCheckout` success, `clearCart`, sign-in transfer) |
| Expiry | 7 days (`maxAge: 604800`) |
| HttpOnly | `true` |
| SameSite | `Lax` |
| Path | `/` |
| Value | Square order ID (string) |

### Read Contract

```typescript
// lib/square/cookies.ts
import { cookies } from "next/headers";

const COOKIE_NAME = "guest-cart-order-id";

export function getGuestCartOrderId(): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}
```

### Write Contract

```typescript
export function setGuestCartOrderId(orderId: string): void {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, orderId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });
}
```

### Clear Contract

```typescript
export function clearGuestCartOrderId(): void {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}
```

### Caller Contract

- **Writers**: `addToCart` server action, `initiateCheckout` server action (on success), Cart transfer on sign-in
- **Readers**: `app/cart/page.tsx`, `addToCart`, `updateCartItem`, `removeCartItem`, `initiateCheckout`
- **Clearers**: `initiateCheckout` success, cart transfer, manual clear, expiry detection
