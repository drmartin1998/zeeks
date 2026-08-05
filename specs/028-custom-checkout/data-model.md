# Data Model: Custom Checkout Page Flow

**Feature**: 028-custom-checkout
**Phase**: 1 — Design & Contracts
**Date**: 2026-08-04

## Entity Relationship

```
Cart (Order, DRAFT)
  │
  ├──(proceed to checkout)──► CheckoutSession
  │                              ├── order (transitioned to OPEN at payment)
  │                              ├── loyaltyReward (created at payment)
  │                              ├── customerProfile
  │                              └── paymentFormData
  │
  └──(payment processed)──► CompletedOrder (COMPLETED)
                               ├── transactionId
                               ├── receiptUrl
                               └── appliedReward (discount reflected in total)
```

## 1. CheckoutData (Aggregate)

Server-constructed data passed to the checkout page client.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `order` | `Cart` | `getCart(squareCustomerId)` | Current cart with line items and subtotal |
| `loyaltyData` | `LoyaltyPanelData` | `getLoyaltyPanelData()` | Loyalty account, program, active reward, earned points |
| `profile` | `CustomerProfile` | `customersApi.retrieve()` | Customer's name and email |
| `error` | `string \| null` | Internal | Aggregate error if any fetch fails |

```typescript
export interface CheckoutData {
  order: Cart | null;
  loyaltyData: LoyaltyPanelData;
  profile: CustomerProfile | null;
  error: string | null;
}
```

---

## 2. PaymentFormInput

Client-submitted form data validated by Zod server-side.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sourceId` | `string` | Yes | One-time card token from Square Web Payments SDK |
| `orderId` | `string` | Yes | The order being paid |
| `rewardTierId` | `string` | No | Selected reward tier ID from cart loyalty panel |
| `loyaltyAccountId` | `string` | No | Loyalty account ID (if rewards enabled) |
| `billingName` | `string` | Yes | Full name on card |
| `billingAddressLine1` | `string` | Yes | Street address |
| `billingCity` | `string` | Yes | City |
| `billingState` | `string` | Yes | State (2-letter code) |
| `billingPostalCode` | `string` | Yes | ZIP/postal code |
| `squareCustomerId` | `string` | Yes | For customer-attached payment |

```typescript
export const PaymentFormSchema = z.object({
  sourceId: z.string().min(1, "Payment token is required"),
  orderId: z.string().min(1),
  rewardTierId: z.string().optional().or(z.literal("")),
  loyaltyAccountId: z.string().optional().or(z.literal("")),
  billingName: z.string().min(1, "Name is required"),
  billingAddressLine1: z.string().min(1, "Address is required"),
  billingCity: z.string().min(1, "City is required"),
  billingState: z.string().length(2, "Use 2-letter state code"),
  billingPostalCode: z.string().min(5, "Valid ZIP code is required"),
  squareCustomerId: z.string().min(1),
});

export type PaymentFormInput = z.infer<typeof PaymentFormSchema>;
```

---

## 3. PaymentResult

Returned from the `processPayment` Server Action.

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Whether payment was processed |
| `transactionId` | `string \| null` | Square transaction ID (on success) |
| `orderId` | `string \| null` | Completed order ID |
| `error` | `string \| null` | User-facing error message (on failure) |
| `errorCode` | `string \| null` | Machine-readable error code |

```typescript
export interface PaymentResult {
  success: boolean;
  transactionId: string | null;
  orderId: string | null;
  error: string | null;
  errorCode: string | null;
}
```

---

## 4. OrderConfirmationData

Passed to the order confirmation page.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `orderId` | `string` | Payment result | Completed order ID |
| `transactionId` | `string` | Payment result | Square transaction reference |
| `total` | `{ amount: number; currency: string }` | Order | Final amount paid |
| `rewardApplied` | `boolean` | Payment flow | Whether a loyalty reward was used |
| `rewardDescription` | `string \| null` | Loyalty reward | Description of the applied reward |

```typescript
export interface OrderConfirmationData {
  orderId: string;
  transactionId: string;
  total: { amount: number; currency: string };
  rewardApplied: boolean;
  rewardDescription: string | null;
}
```

---

## 5. State Transitions

### Order States

```
DRAFT ──[processPayment Server Action]──► OPEN ──[payment success]──► COMPLETED
                                                    │
                                                    └──[payment failure]──► OPEN (retryable)
```

### Loyalty Reward States

```
[cart page] → tier selected (visual only, no API call)
[processPayment] → createLoyaltyReward(order_id) → ISSUED
[payment success] → Square auto-redeems → REDEEMED
[payment failure] → reward stays ISSUED (points locked, retryable)
[customer returns] → getFirstIssuedReward finds it → pre-selected on cart
```

---

## 6. Validation Rules

| Rule | Enforcement |
|------|-------------|
| Customer must be authenticated | Clerk `auth()` in page.tsx |
| Order must exist and be DRAFT | `ordersApi.get()` check in Server Action |
| Payment sourceId must be valid | Square API rejects invalid tokens |
| Payment amount must match order total | Server recalculates from order ID |
| Billing state must be valid 2-letter code | Zod regex validation |
| One reward per order max | `getFirstIssuedReward` pre-check before creation |
| Idempotency on payment | `payment-{orderId}` key prevents duplicates |
