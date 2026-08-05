# Contracts: Custom Checkout Page Flow

**Feature**: 028-custom-checkout
**Phase**: 1 — Design & Contracts

## Server Action: `processPayment`

Single Server Action that handles the entire payment flow atomically.

```typescript
// Location: app/cart/actions.ts (replaces initiateCheckout)
"use server"

export async function processPayment(
  _prevState: PaymentResult | null,
  formData: FormData,
): Promise<PaymentResult>;
```

**Input** (from formData via `PaymentFormSchema`):
- `sourceId` — card token from Square Web Payments SDK
- `orderId` — order being paid
- `rewardTierId` — selected reward tier (optional)
- `loyaltyAccountId` — loyalty account (optional)
- `billingName`, `billingAddressLine1`, `billingCity`, `billingState`, `billingPostalCode`
- `squareCustomerId`

**Flow**:
1. Validate form input with Zod (`PaymentFormSchema`)
2. Auth check via `auth()`
3. Get order, verify it exists and is DRAFT
4. Transition order DRAFT → OPEN via `ordersApi.update`
5. If `rewardTierId` + `loyaltyAccountId` provided:
   a. Check for existing ISSUED reward
   b. If same tier: skip. If different: delete old, create new. If none: create new.
   c. `createLoyaltyReward(orderId, loyaltyAccountId, rewardTierId)` — with `order_id`
6. Process payment via `paymentsApi.create`
7. If payment succeeds: return `{ success: true, transactionId, orderId }`
8. If payment fails: show decline error, order stays OPEN

**Error cases**:

| Condition | Result |
|-----------|--------|
| Zod validation fails | `{ success: false, error: field-level message }` |
| Not authenticated | `{ success: false, error: "Please sign in" }` |
| Order not found / not DRAFT | `{ success: false, error: "Order cannot be processed" }` |
| Reward creation fails | `{ success: false, error: "Failed to apply reward" }` |
| Card declined | `{ success: false, error: mapped decline message }` |
| Square API error | `{ success: false, error: "Payment service unavailable" }` |

---

## Page: `/checkout`

**Route**: `app/checkout/page.tsx` (protected, authenticated only)

**Data fetches** (parallel `Promise.allSettled`):
1. `getCart(squareCustomerId)` — order with line items
2. `getLoyaltyPanelData(squareCustomerId, orderId)` — loyalty account + program + active reward
3. Customer profile from Clerk/Square

**Guards**:
- No `userId` → redirect to sign-in
- No `squareCustomerId` → show "Account setup in progress"
- Empty cart → redirect to `/cart`
- Order state !== DRAFT → redirect to `/cart` with message

**Props to `CheckoutPageClient`**:
```typescript
interface CheckoutPageClientProps {
  checkoutData: CheckoutData;
}
```

---

## Page: `/order/confirmation`

**Route**: `app/order/confirmation/page.tsx` (replaces `/order/result`)

**Parameters**: Reads from search params: `?orderId=...&transactionId=...`

**Displays**:
- Success message
- Transaction reference number
- Order total
- Applied reward description (if any)
- Link back to store

---

## Component Contracts

### `CheckoutPageClient`

```typescript
// components/checkout/checkout-page-client.tsx ("use client")
interface CheckoutPageClientProps {
  checkoutData: CheckoutData;
}
```

Renders: OrderSummary, RewardDiscount (if applicable), CustomerInfo, PaymentForm.
Loading: skeleton placeholders per-section via Suspense boundaries.

### `PaymentForm`

```typescript
// components/checkout/payment-form.tsx ("use client")
interface PaymentFormProps {
  orderId: string;
  squareCustomerId: string;
  rewardTierId: string | null;
  loyaltyAccountId: string | null;
  total: { amount: number; currency: string };
}
```

- Initializes Square Web Payments SDK on mount
- Attaches card input to a DOM container
- Collects billing address fields
- Uses `useActionState` with `processPayment`
- On submit: tokenize card → populate hidden `sourceId` field → submit form

### `OrderSummary`

```typescript
// components/checkout/order-summary.tsx (Server or Client — read-only display)
interface OrderSummaryProps {
  items: CartLineItem[];
  subtotal: { amount: number; currency: string };
  rewardDiscount: { amount: number; description: string } | null;
  total: { amount: number; currency: string };
}
```

### `RewardDiscount`

```typescript
// components/checkout/reward-discount.tsx
interface RewardDiscountProps {
  description: string;
  discountAmount: number; // in cents, negative
  remainingPoints: number;
}
```

### `CustomerInfo`

```typescript
// components/checkout/customer-info.tsx
interface CustomerInfoProps {
  name: string;
  email: string;
}
```

---

## Square Web Payments SDK Integration

```typescript
// Square Web Payments SDK initialization (client-side only)
const payments = Square.payments(
  process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!,
  process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!
);

const card = await payments.card();
await card.attach("#card-container");

// On form submit:
const tokenResult = await card.tokenize();
if (tokenResult.status === "OK") {
  // Set hidden form field: sourceId = tokenResult.token
  // Submit form → triggers processPayment Server Action
}
```

**Required environment variable** (add to `lib/env.ts`):
- `NEXT_PUBLIC_SQUARE_APPLICATION_ID` — already validated as `SQUARE_APPLICATION_ID`, just needs `NEXT_PUBLIC_` prefix exposure
