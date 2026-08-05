# Research: Rewards Redemption

**Feature**: 027-rewards-redemption
**Phase**: 0 — Outline & Research
**Date**: 2026-08-04

## 1. Square Loyalty API: Reward Lifecycle

### Decision: Create reward with `order_id`, delete to deselect, search for pre-selection

**Rationale**: Square's `createLoyaltyReward` accepts an `order_id` parameter. When provided, Square attaches the reward and related discount to the order automatically. This is the correct flow for cart-integrated reward redemption — the discount becomes part of the order's totals.

**Square API methods used**:

| Method | Purpose | Required Fields |
|--------|---------|-----------------|
| `loyaltyApi.rewards.create()` | Select a reward (apply to order) | `reward_tier_id`, `loyalty_account_id`, `order_id`, `idempotency_key` |
| `loyaltyApi.rewards.delete()` | Deselect a reward (remove from order) | `reward_id` |
| `loyaltyApi.rewards.search()` | Find existing rewards on an order (for pre-selection on page load) | `loyalty_account_id`, optional `status` filter |
| `loyaltyApi.programs.get()` | Fetch reward tier definitions | `program_id` ("main") |
| `loyaltyApi.calculatePoints()` | Estimate points earned from order | `order_id`, `loyalty_account_id` |
| `loyaltyApi.accounts.search()` | Fetch loyalty account balance | `customerIds` |

**Key insight**: When a reward is created with `order_id`, Square handles the discount application on the order side. Deleting the reward removes the discount. This means the cart page doesn't need to manually recalculate order totals — Square does it.

**LoyaltyReward status lifecycle**:
```
[createReward] → ISSUED → [redeemReward on payment] → REDEEMED (terminal)
                ↓
              [deleteReward] → DELETED (removed from order, points restored)
```

### Alternatives Considered

- **Creating reward without `order_id` then attaching later**: Adds complexity and an extra step. The `order_id` approach is simpler and transactional.
- **Using `accumulatePoints`/`adjustPoints` instead of reward creation**: Not applicable — this is redemption, not accrual.

---

## 2. Server Action vs Route Handler for Mutations

### Decision: Use Server Actions for reward selection/deselection

**Rationale**: The existing cart mutations (`addToCart`, `removeCartItem`, `updateCartItem`) all use Server Actions in `app/cart/actions.ts`. Following this established pattern:
- Keeps all cart-related mutations co-located
- Avoids adding an extra network hop (client → Route Handler → Square vs client → Server Action → Square)
- Uses the same `revalidatePath("/cart")` pattern for cache invalidation
- Consistent error handling with `useActionState`

**For read operations**: Loyalty data (account, program, rewards) is fetched server-side in the cart page's Server Component, parallelized with existing cart data fetches via `Promise.allSettled()`.

### Alternatives Considered

- **Route Handlers (`app/api/loyalty/rewards/`)**: Would add consistency with Constitution II but introduces unnecessary indirection. Pre-existing cart code already uses Server Actions for Square mutations.
- **Client-side fetch to Route Handler → Square**: Violates Constitution I (Server Components First) and adds latency.

---

## 3. Loyalty Data Fetching Strategy

### Decision: Parallel `Promise.allSettled()` in the cart Server Component

**Rationale**: The existing cart page already does 2-3 sequential data fetches. Loyalty adds up to 4 more:
1. `searchLoyaltyAccounts(customerId)` → account + balance
2. `retrieveLoyaltyProgram("main")` → reward tiers
3. `searchLoyaltyRewards(accountId, { status: "ISSUED" })` → pre-selected reward
4. `calculateLoyaltyPoints(orderId, accountId)` → earned points estimate

All 4 MUST run in parallel with `Promise.allSettled()` to avoid waterfall requests. Each failure degrades independently (inline error, panel hidden, or estimate hidden).

**Suspense boundaries**:
```tsx
<Suspense fallback={<LoyaltyPanelSkeleton />}>
  <LoyaltyPanel />
</Suspense>
```

The skeleton renders immediately; real content streams in when data is ready.

### Alternatives Considered

- **Sequential fetches**: Unacceptable — each fetch adds ~200-500ms, totaling 1-2s of serial latency.
- **Single mega-endpoint**: Over-engineering for a mid-size feature; violates modularity.
- **Client-side fetch after hydration**: Violates Constitution I and adds jank.

---

## 4. Figma Design Token Mapping

### Decision: Map Figma `Zeeks Semantic` variables to Tailwind classes

**Rationale**: The Figma file uses the `Zeeks Semantic` variable collection. Mapping variable IDs to their names reveals the design token structure:

| Figma Variable ID | Token Name | Usage | Tailwind Class |
|-------------------|-----------|-------|---------------|
| `VariableID:10:38` | `brand/gold` | Points balance, selected border, brand icon | `text-[#F5A623]` / `border-[#F5A623]` |
| `VariableID:10:46` | `text/dark` | Header text (dark navy) | `text-[#0E0E2C]` |
| `VariableID:10:51` | `text/primary` | Body text | `text-[#0E0E2C]` |
| `VariableID:10:53` | `text/tertiary` | Muted text, point costs | `text-[#9090A8]` |
| `VariableID:10:54` | `text/inverse` | White text on dark/gold bg | `text-white` |
| `VariableID:10:62` | `surface/brand` | Primary button fill | `bg-[#F5A623]` |
| `VariableID:10:65` | `border/default` | Card borders, dividers | `border-[#CDCDD8]` |
| `VariableID:10:43` | `surface/page` | Page background | `bg-white` |
| `VariableID:10:44` | `surface/secondary` | Order summary bg | `bg-[#F5F5F8]` |

**Panel-specific colors**:
- Panel background: `#FDF8F0` (cream) — no existing variable, define as component constant
- Selected badge background: `#FEF3C7` (light gold) — Tailwind `bg-amber-100`
- Membership tier text: `brand/gold` variable

**Typography**:
- Header brand: Inter Extra Bold 800, 16px
- Points balance: Inter Extra Bold 800, 22px
- Reward name: Inter Bold 700, 14px
- Reward description: Inter Regular 400, 12px
- Section heading: Inter Bold 700, 15px
- Footer text: Inter Regular 400, 13px

### Alternatives Considered

- **CSS custom properties from `figma_export_tokens`**: Would ensure design-drift-free synchronization but requires setting up tokens.config.json and an export pipeline. Deferred — out of scope for this feature.
- **Hardcoded hex values**: Faster to implement but harder to maintain. Acceptable for this feature since the design tokens aren't exported yet.

---

## 5. Component Architecture (Figma-to-Code)

### Decision: Server Component wrapper + Client Component leaf

The Figma `squares-loyalty-panel` (167:2749) maps to:

```
LoyaltyPanel (Server Component — data fetch)
├── LoyaltyPanelClient ("use client" — radio selection, event handlers)
│   ├── LoyaltyHeader (brand logo, tier name, points balance)
│   ├── Divider
│   ├── "Apply Your Rewards" heading
│   ├── RewardOption[] (radio-style list)
│   │   ├── [x] RewardOption (selected state: gold border, filled circle, "Selected" badge)
│   │   └── [ ] RewardOption (unselected: gray border, empty circle)
│   └── LoyaltyFooter (remaining points after selection)
```

**Why `"use client"` for `LoyaltyPanelClient`**: Radio-button selection requires `onClick` handlers and React state (`useState` for `selectedRewardId`). The data props are passed from the Server Component, so the Client Component is a pure presentation+interaction layer.

### Alternatives Considered

- **Fully server-rendered with `<form>` + `<input type="radio">`**: Matches Constitution V (progressive enhancement) but the Figma design uses custom-styled radio indicators (gold circle, "Selected" badge) that are impossible to style purely with native `<input type="radio">` CSS. Custom implementation with ARIA `role="radiogroup"` is needed.
- **All-in-one Client Component**: Would force all loyalty data fetching client-side, violating Constitution I and causing a flash of empty state.

---

## 6. Earned Points Calculation

### Decision: Call `calculateLoyaltyPoints` in the Server Component

**Rationale**: Square's `calculateLoyaltyPoints` accounts for loyalty program accrual rules, promotions, and tax mode settings. A client-side estimate based on subtotal × points-per-dollar would be inaccurate for programs with tiered earning or promotions.

**API call**:
```ts
loyaltyApi.calculatePoints({
  programId: loyaltyProgramId,
  orderId: currentOrderId,
  loyaltyAccountId: accountId,
})
```

The result (`points`) is displayed in the order summary sidebar as:
```
"You'll earn {points} points on this order"
```
with the points number in gold/bold.

**Edge case**: If `calculateLoyaltyPoints` fails, the earned-points notice is hidden silently (non-blocking). The customer can still select rewards and checkout.

---

## 7. Race Condition Prevention

### Decision: Disable reward option clicks during in-flight API calls

**Pattern**:
```tsx
const [isMutating, setIsMutating] = useState(false);

async function handleSelect(rewardTierId: string) {
  if (isMutating) return;
  setIsMutating(true);
  try {
    await selectReward(rewardTierId);
  } finally {
    setIsMutating(false);
  }
}
```

Additionally, Server Actions use `idempotency_key: crypto.randomUUID()` to prevent Square from processing duplicate requests.

**Double-click protection**: The `disabled` state on radio option rows sets `pointer-events: none` and a subtle opacity reduction during mutation.

---

## Summary of Decisions

| Decision | Rationale |
|----------|-----------|
| Create rewards with `order_id` | Square handles discount attachment automatically |
| Use Server Actions for mutations | Matches existing cart pattern |
| Parallel `Promise.allSettled()` for data fetching | Avoids waterfall latency |
| `<Suspense>` with skeleton placeholder | Constitution IV streaming + UX continuity |
| Custom radio indicators (not native `<input>`) | Matches Figma design; ARIA `radiogroup` role for accessibility |
| `calculateLoyaltyPoints` API for earned points | Accuracy over simplicity |
| Client-side click throttling | Simple, effective race condition prevention |
