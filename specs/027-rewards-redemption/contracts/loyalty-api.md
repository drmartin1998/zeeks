# Contracts: Loyalty Reward API

**Feature**: 027-rewards-redemption
**Phase**: 1 — Design & Contracts

## Server Actions (Cart Mutations)

### `selectReward`

Applies a loyalty reward to the current order by creating a `LoyaltyReward` in Square with the `order_id` attached.

```typescript
// Location: app/cart/actions.ts
"use server"

import { SelectRewardSchema } from "@/lib/square/types";
import type { SelectRewardResult } from "@/lib/square/types";

export async function selectReward(
  orderId: string,
  loyaltyAccountId: string,
  rewardTierId: string
): Promise<SelectRewardResult>;
```

**Input validation** (Zod):
```typescript
const SelectRewardSchema = z.object({
  orderId: z.string().min(1),
  loyaltyAccountId: z.string().min(1),
  rewardTierId: z.string().min(1),
});
```

**Square API call**:
```typescript
const { reward } = await loyaltyApi.rewards.create({
  idempotencyKey: crypto.randomUUID(),
  reward: {
    loyaltyAccountId,
    rewardTierId,
    orderId,
  },
});
```

**Post-condition**: `revalidatePath("/cart")` so the cart page re-fetches order totals (which now include the reward discount) and loyalty data (updated balance).

**Error cases**:

| Error | HTTP Analogy | Response |
|-------|-------------|----------|
| Invalid input (Zod) | 400 | `{ success: false, error: "Invalid reward selection" }` |
| Not authenticated | 401 | `{ success: false, error: "Please sign in" }` |
| Insufficient points | — | `{ success: false, error: "Not enough points" }` |
| Square API error | 502 | `{ success: false, error: "Unable to apply reward" }` |
| Success | 200 | `{ success: true, reward: LoyaltyReward }` |

---

### `deselectReward`

Removes a previously selected reward from the order.

```typescript
// Location: app/cart/actions.ts
"use server"

import { DeselectRewardSchema } from "@/lib/square/types";
import type { DeselectRewardResult } from "@/lib/square/types";

export async function deselectReward(
  orderId: string,
  rewardId: string
): Promise<DeselectRewardResult>;
```

**Input validation** (Zod):
```typescript
const DeselectRewardSchema = z.object({
  orderId: z.string().min(1),
  rewardId: z.string().min(1),
});
```

**Square API call**:
```typescript
await loyaltyApi.rewards.delete({
  rewardId,
});
```

**Post-condition**: `revalidatePath("/cart")`.

**Error cases**:

| Error | HTTP Analogy | Response |
|-------|-------------|----------|
| Invalid input (Zod) | 400 | `{ success: false, error: "Invalid reward deselect" }` |
| Not authenticated | 401 | `{ success: false, error: "Please sign in" }` |
| Reward not found / already deleted | 404 | `{ success: false, error: "Reward not found" }` |
| Square API error | 502 | `{ success: false, error: "Unable to remove reward" }` |
| Success | 200 | `{ success: true }` |

---

## Server Component Data Functions (Read Operations)

### `getLoyaltyPanelData`

Aggregate function called from the cart Server Component to fetch all loyalty data in parallel.

```typescript
// Location: lib/square/loyalty.ts (new function)

export async function getLoyaltyPanelData(
  squareCustomerId: string,
  orderId: string
): Promise<LoyaltyPanelData>;
```

**Internal parallel fetches**:
```typescript
const [accountResult, programResult, rewardsResult, pointsResult] =
  await Promise.allSettled([
    fetchLoyaltyAccount(squareCustomerId),      // searchLoyaltyAccounts
    fetchLoyaltyProgram(),                       // retrieveLoyaltyProgram("main")
    fetchActiveReward(orderId, accountId),       // searchLoyaltyRewards(status=ISSUED)
    fetchEarnedPoints(orderId, accountId),       // calculateLoyaltyPoints
  ]);
```

**Graceful degradation**: Each failure only affects its own section. A failed `fetchLoyaltyAccount` means no panel renders. A failed `fetchEarnedPoints` means the earned-points notice is hidden.

---

## Component Props Contract

### `LoyaltyPanel`

```typescript
// components/cart/loyalty-panel/loyalty-panel.tsx (Server Component)

// Props: none — fetches data internally via getLoyaltyPanelData()
// Requires: squareCustomerId from Clerk auth(), orderId from cart page context
// Renders: <Suspense> wrapper around <LoyaltyPanelClient data={panelData} />
```

### `LoyaltyPanelClient`

```typescript
// components/cart/loyalty-panel/loyalty-panel-client.tsx ("use client")

interface LoyaltyPanelClientProps {
  data: LoyaltyPanelData;
  orderId: string;
}

// Renders:
//   1. LoyaltyHeader (brand, tier, points)
//   2. Divider
//   3. "Apply Your Rewards" heading
//   4. RewardOption[] (radio list)
//   5. LoyaltyFooter (remaining points)
// States:
//   - data.error → error state with "Try again" button
//   - data.account === null → nothing (panel not rendered)
//   - Normal → full panel
```

### `RewardOption`

```typescript
// components/cart/loyalty-panel/reward-option.tsx ("use client")

interface RewardOptionProps {
  tier: RewardTier;
  isSelected: boolean;
  isAffordable: boolean;
  isDisabled: boolean; // true during API call
  onSelect: (tierId: string) => void;
  onDeselect: () => void;
}

// Renders:
//   - Radio circle (filled gold if selected, empty gray if not)
//   - Reward name (bold, 14px)
//   - Reward description (regular, 12px, muted)
//   - "Selected" badge (only when isSelected)
//   - Point cost label (right-aligned, muted)
// States:
//   - Selected + affordable: gold border (2px), filled circle, "Selected" badge
//   - Unselected + affordable: gray border (1px), empty circle
//   - Unaffordable: reduced opacity (0.5), not clickable
//   - Disabled (in-flight): pointer-events-none, slight opacity reduction
```

### `LoyaltyPanelSkeleton`

```typescript
// components/cart/loyalty-panel/loyalty-panel-skeleton.tsx

// Renders: A gray placeholder matching the loyalty panel dimensions (800×514px)
// Includes: skeleton blocks for header, divider, 4 reward rows, and footer
// Uses: Tailwind `animate-pulse` with gray bg placeholders
```

---

## ARIA Contract (Accessibility)

The `LoyaltyPanelClient` implements a `radiogroup` pattern:

```html
<div role="radiogroup" aria-label="Apply Your Rewards">
  <div role="radio"
       aria-checked="true|false"
       aria-disabled="true|false"
       tabindex="0|-1"
       data-state="selected|unselected|unavailable"
       onclick="...">
    <!-- reward content -->
  </div>
  ...
</div>
```

**Keyboard navigation**:
- `Tab` focuses the selected or first radio option
- `Arrow Up/Down` moves focus between options
- `Space/Enter` selects the focused option
- Selecting an already-selected option deselects it
