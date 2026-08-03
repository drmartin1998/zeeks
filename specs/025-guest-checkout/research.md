# Research: Guest Cart & Checkout

**Feature**: 025-guest-checkout
**Date**: 2026-08-03

## Research Tasks

### 1. Guest Cart Storage Strategy

**Decision**: Store the Square DRAFT order ID directly in a browser cookie for guest users. No Square customer record is created for guests.

**Rationale**: The existing authenticated cart uses Square draft orders found via `customerFilter` with `squareCustomerId`. Guests have no customer ID, so filtering by customer is impossible. Two alternatives:

- **Alternative A — Anonymous Square orders**: Create a DRAFT order without `customerId` (Square supports this — `customerId` is optional on `orders.create()`). Store the resulting `orderId` in a `guest-cart-order` cookie. All subsequent cart operations use `ordersApi.get(orderId)` and `ordersApi.update(orderId)` directly — no search needed. This is the simplest approach and preserves the existing Square Orders API integration. **CHOSEN**.

- **Alternative B — Client-side cart only**: Store full cart data in localStorage/cookies, only create the Square order at checkout time. Simpler for carts but loses the ability to validate prices and availability server-side before checkout. Rejected because it introduces data integrity risks (stale prices, unavailable items discovered late).

- **Alternative C — Temporary Square Customer**: Create a temporary Square Customer for each guest session. Pollutes the Square CRM with ephemeral records and adds unnecessary API calls. Rejected.

**Implementation**: Cookie name `guest-cart-order-id` stores the Square `orderId`. Set on first `addToCart` for a guest user. Cleared on checkout completion or cart expiry.

### 2. Square API Guest Order Support

**Decision**: Square's `orders.create()` accepts `customerId` as optional. Orders can exist without a customer reference.

**Rationale**: Verified via Square Node.js SDK documentation (`/autodocs/api-reference/OrdersClient.md`). The `customerId` field is documented as "Optional — Associated customer ID." This means:

1. **Create**: `ordersApi.create({ order: { locationId, lineItems: [...] }, idempotencyKey })` works without `customerId`.
2. **Update**: `ordersApi.update({ orderId, order: { locationId, lineItems: [...] }, idempotencyKey })` works regardless of customer association.
3. **Get**: `ordersApi.get({ orderId })` works without customer context.
4. **Search**: Cannot search by customer for guests (no customer), but we don't need search — we store the `orderId` directly.
5. **Payment Link**: `checkoutApi.paymentLinks.create({ order: { locationId, lineItems }, ... })` does not require `customerId` — payment links are inherently anonymous.

### 3. Cart Identifier Mechanism

**Decision**: Use a randomly-generated `guestId` stored in a cookie to identify the guest session, and map it to the Square `orderId`.

**Rationale**: A two-identifier system provides flexibility. The `guestId` (UUID v4) identifies the session and survives across pages even after cookie changes. The `orderId` is the actual Square order reference.

**Simplified approach**: Single cookie `guest-cart-order-id` stores the Square `orderId` directly. If the cookie is cleared, the guest loses their cart (expected behavior). This avoids any server-side session storage.

**Cookie properties**:
- Name: `guest-cart-order-id`
- Value: Square order ID string
- Expiry: 7 days from last activity
- HttpOnly: No (client doesn't need to read it directly)
- SameSite: Lax
- Path: `/`

### 4. Auth-to-Guest Cart Transfer (Sign-In)

**Decision**: When a guest with an active cart signs in, transfer the guest cart line items to the authenticated cart by updating the guest's DRAFT order to include a `customerId` pointing to the authenticated user's Square customer. Then clear the guest cookie.

**Rationale**: This is simpler than creating a new order and copying line items. Square supports updating an existing order's `customerId` via `orders.update()`. The flow:

1. Guest signs in → Clerk `auth()` now returns `userId`
2. Get authenticated `squareCustomerId` from Clerk metadata
3. Get guest `orderId` from cookie
4. Update the guest order: `ordersApi.update({ orderId, order: { customerId: squareCustomerId, locationId, ...currentLineItems } })`
5. Delete the `guest-cart-order-id` cookie
6. Guest cart is now the authenticated cart

**Alternative**: Create a new authenticated draft order and copy line items from guest order. More API calls, risk of line item drift. Rejected.

**Merge scenario**: If the authenticated user already has a draft order, merge line items from the guest order into the authenticated order before clearing the guest order.

### 5. Cart Expiry Mechanism

**Decision**: Guest carts expire after 7 days of inactivity. Expiry is enforced at read time — when the cart page loads and a guest cookie is present but expired, the cookie is cleared and the cart shown as empty.

**Rationale**: No cron job needed. Cookie-based expiry is built into the cookie mechanism (`maxAge`). Additionally, Square orders in DRAFT state don't need cleanup — they don't affect anything if abandoned. The cookie expiry is the only enforcement point.

**Implementation**:
- Set cookie `maxAge: 7 * 24 * 60 * 60` (7 days in seconds) on every cart mutation
- On cart page load, if cookie exists but the referenced Square order no longer exists (deleted/expired), clear cookie and show empty cart

### 6. Price Validation at Checkout

**Decision**: Guest cart prices are validated server-side at checkout time against Square's catalog, exactly like the authenticated flow. Prices captured at add-to-cart time (in the cookie or order line items) are recomputed at checkout.

**Rationale**: Prevents stale-price exploits where a guest modifies their cookie to claim a lower price. Since guest cart line items are stored as Square Order line items (with `catalogObjectId` and `basePriceMoney`), Square computes the correct total at payment link creation time. The store does not need to re-validate prices directly — Square's payment link creation will reject mismatches.

### 7. Existing Code Reuse

**Decision**: Reuse the existing cart and checkout infrastructure with guest-aware paths, rather than duplicating logic.

**Key functions requiring guest-aware overloads**:

| Function | Current | Guest Overload |
|----------|---------|----------------|
| `findOrCreateDraftOrder` | `(squareCustomerId)` | `(guestId: null, orderId?: string)` — uses `orderId` cookie |
| `findExistingDraftOrder` | `(squareCustomerId)` | Not used for guests — orderId is in cookie |
| `getCart` | `(squareCustomerId)` | `(orderId: string)` — gets order directly |
| `getCartItemCount` | `(squareCustomerId)` | `(orderId: string)` — gets order directly |
| `createPaymentLink` | `(squareCustomerId, returnUrl)` | Accept optional `squareCustomerId` or `orderId` |

**Strategy**: Add optional `orderId` parameter to all cart functions. When `orderId` is provided (guest path), use direct `ordersApi.get(orderId)`. When absent (auth path), use existing `customerFilter` search.

## Resolved Unknowns

All unknowns resolved through codebase exploration and Square API documentation:

- Square API version: 45.0.1 (package.json)
- `customerId` optional on order creation: Confirmed via SDK docs
- Guest cart identifier: Cookie-based `guest-cart-order-id` storing Square `orderId`
- Auth-to-guest transfer: Update guest order's `customerId` on sign-in
- Expiry: Cookie `maxAge` + server-side order existence check
- Existing infrastructure: cart.ts, checkout.ts, actions.ts all reusable with guest-aware overloads
