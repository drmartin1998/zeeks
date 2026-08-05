# Data Model: Rewards Redemption

**Feature**: 027-rewards-redemption
**Phase**: 1 — Design & Contracts
**Date**: 2026-08-04

## Entity Relationship

```
LoyaltyProgram (1) ──< RewardTier (N)
       │
       │ (fetched via retrieveLoyaltyProgram)
       │
LoyaltyAccount (1) ──< LoyaltyReward (N)
       │                    │
       │ (belongs to)       │ (attached to)
       │                    │
  Customer              Order (cart)
```

## 1. LoyaltyAccount (Extended)

*Extends the existing `LoyaltySummary` in `lib/square/types.ts`.*

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `id` | `string` | Square API | Loyalty account ID |
| `balance` | `number` | Square API | Current point balance |
| `lifetimePoints` | `number` | Square API | Total points ever earned |
| `customerId` | `string` | Square API | Associated Square customer ID |
| `programId` | `string` | Square API | Loyalty program ID |
| `enrolledAt` | `string \| null` | Square API | ISO 8601 enrollment timestamp |

**TypeScript interface** (add to `lib/square/types.ts`):

```typescript
export interface LoyaltyAccount {
  id: string;
  balance: number;
  lifetimePoints: number;
  customerId: string;
  programId: string;
  enrolledAt: string | null;
}
```

**State**: Read-only from cart page perspective. Balance changes when rewards are created/deleted but is re-fetched server-side on revalidation.

---

## 2. RewardTier

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `id` | `string` | Square API | Reward tier ID |
| `name` | `string` | Square API | Display name (e.g., "$10 Off Your Order") |
| `points` | `number` | Square API | Points required to redeem |
| `description` | `string \| null` | Square API | Optional tier description |
| `pricingRuleData` | `object \| null` | Square API | Discount type and amount |

**TypeScript interface**:

```typescript
export interface RewardTier {
  id: string;
  name: string;
  points: number;
  description: string | null;
  discountType: "FIXED_AMOUNT" | "FIXED_PERCENTAGE" | null;
  discountAmount: number | null; // In cents for FIXED_AMOUNT, percentage for FIXED_PERCENTAGE
}
```

**Derived display fields**:
- `affordable: boolean` — `points <= accountBalance` (computed client-side)
- `discountLabel: string` — e.g., "$10 Off" (derived from `discountAmount`)

**State**: Immutable per page load. Fetched fresh on each cart page render (no caching of reward tiers — they rarely change).

---

## 3. LoyaltyReward

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `id` | `string` | Square API | Reward ID |
| `status` | `"ISSUED" \| "REDEEMED" \| "DELETED"` | Square API | Current state |
| `loyaltyAccountId` | `string` | Square API | Owner account |
| `rewardTierId` | `string` | Square API | Redeemed tier |
| `points` | `number` | Square API | Points used |
| `orderId` | `string \| null` | Square API | Attached order (null if stand-alone) |
| `createdAt` | `string` | Square API | ISO 8601 creation timestamp |

**TypeScript interface**:

```typescript
export interface LoyaltyReward {
  id: string;
  status: "ISSUED" | "REDEEMED" | "DELETED";
  loyaltyAccountId: string;
  rewardTierId: string;
  points: number;
  orderId: string | null;
  createdAt: string;
}
```

**State transitions**:

```
[page load] → searchRewards(orderId) → ISSUED reward found → pre-select in UI
[user clicks tier] → createReward(tierId, orderId) → ISSUED → show as selected
[user clicks selected] → deleteReward(rewardId) → DELETED → deselect in UI
[checkout complete] → redeemReward happens on Square side → REDEEMED (terminal)
```

---

## 4. LoyaltyProgramDetail

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `id` | `string` | Square API | Program ID |
| `status` | `string` | Square API | "ACTIVE" or "INACTIVE" |
| `rewardTiers` | `RewardTier[]` | Square API | Available reward tiers |
| `accrualRules` | `object[]` | Square API | Points earning rules (for earned-points calc) |

**TypeScript interface**:

```typescript
export interface LoyaltyProgramDetail {
  id: string;
  status: string;
  rewardTiers: RewardTier[];
}
```

---

## 5. EarnedPoints

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `points` | `number \| null` | Square API | Estimated points to earn from current order |
| `error` | `string \| null` | Internal | Error message if calculation failed |

**TypeScript interface**:

```typescript
export interface EarnedPoints {
  points: number | null;
  error: string | null;
}
```

---

## 6. LoyaltyPanelData (Aggregate)

The union of all loyalty data injected into the cart page. Used as a single prop to `LoyaltyPanelClient`.

```typescript
export interface LoyaltyPanelData {
  account: LoyaltyAccount | null;
  program: LoyaltyProgramDetail | null;
  activeReward: LoyaltyReward | null;
  earnedPoints: EarnedPoints | null;
  error: string | null;
}
```

**Loading states**: When `account` and `program` are both `null` and `error` is `null`, the skeleton is shown. When data arrives, the panel renders. When `error` is non-null, the error state with "Try again" button renders.

---

## 7. Server Action Input/Output Types

### selectReward

```typescript
export const SelectRewardSchema = z.object({
  orderId: z.string().min(1),
  loyaltyAccountId: z.string().min(1),
  rewardTierId: z.string().min(1),
});

export type SelectRewardInput = z.infer<typeof SelectRewardSchema>;

export type SelectRewardResult = {
  success: boolean;
  reward?: LoyaltyReward;
  error?: string;
};
```

### deselectReward

```typescript
export const DeselectRewardSchema = z.object({
  orderId: z.string().min(1),
  rewardId: z.string().min(1),
});

export type DeselectRewardInput = z.infer<typeof DeselectRewardSchema>;

export type DeselectRewardResult = {
  success: boolean;
  error?: string;
};
```

---

## Validation Rules

| Rule | Source | Enforcement |
|------|--------|-------------|
| Customer must be authenticated | Clerk `auth()` | Page level — redirect if no userId |
| Customer must have `squareCustomerId` | Clerk privateMetadata | Graceful skip — panel not rendered |
| `SQUARE_LOYALTY_PROGRAM_ID` must be configured | `lib/env.ts` | Graceful skip — panel not rendered |
| `orderId` must reference a DRAFT order owned by the customer | Square API error | Server-side check; return error |
| `rewardTierId` must belong to the loyalty program | Square API error | Inherent — Square rejects invalid tiers |
| Point cost must be ≤ account balance | FR-009 | Client-side disable + server-side check |
| Only one reward per order | FR-006 | Client-side UI constraint + Square constraint |

---

## Data Flow Diagram

```
Cart Page (Server Component)
  │
  ├─[getCart()]───────────► ordersApi ───► Cart (line items, totals)
  │
  ├─[searchLoyaltyAccounts()] ► loyaltyApi ───► LoyaltyAccount
  ├─[retrieveLoyaltyProgram()] ► loyaltyApi ───► LoyaltyProgramDetail
  ├─[searchLoyaltyRewards()]─► loyaltyApi ───► LoyaltyReward | null
  └─[calculateLoyaltyPoints()] ► loyaltyApi ───► EarnedPoints
       │
       ▼
  LoyaltyPanel (RSC) ──props──► LoyaltyPanelClient ("use client")
                                   │
                                   ├── onClick(select) → selectReward(tierId) → revalidatePath("/cart")
                                   └── onClick(deselect) → deselectReward(rewardId) → revalidatePath("/cart")
```
