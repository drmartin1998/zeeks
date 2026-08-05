# Quickstart: Rewards Redemption

**Feature**: 027-rewards-redemption
**Phase**: 1 — Design & Contracts

## Prerequisites

Before testing this feature, ensure:

1. **Dev server is running** (port 3000):
   ```bash
   lsof -ti:3000  # If a process is listed, reuse it
   vercel dev      # If not running, start it
   ```

2. **Square Sandbox has a loyalty program configured**:
   - Log into Square Developer Dashboard → Loyalty
   - Verify a program exists with at least 1 reward tier (e.g., "$10 Off — 1,000 pts")
   - Set `SQUARE_LOYALTY_PROGRAM_ID` in Vercel/`.env.local`

3. **A test Clerk user exists** with:
   - A linked Square customer (via `squareCustomerId` in `privateMetadata`)
   - A loyalty account with a known point balance (enrolled automatically on sign-up per spec 016)

4. **The test user has items in their cart** (a Square DRAFT order):
   - Browse the store → add products to cart

## Validation Scenarios

### VS-1: Cart page loads with loyalty panel visible

**Given**: Authenticated user with loyalty account (4,280 points) and items in cart

1. Navigate to `/cart`
2. **Expect**: Within 3 seconds, a "Squares Loyalty" panel appears below the cart items
3. **Expect**: Panel shows the customer's point balance as a large number
4. **Expect**: All reward tiers are listed with names, descriptions, and point costs

**Command** (from browser):
```
Open /cart
```

---

### VS-2: Select a reward option

**Given**: Loyalty panel visible with affordable reward tiers

1. Click on a reward option (e.g., "$10 Off Your Order — 1,000 pts")
2. **Expect**: The option gets a gold border (2px) and filled gold circle
3. **Expect**: A "Selected" badge appears on the reward row
4. **Expect**: The panel footer updates to show remaining points (e.g., "3,280 points remaining after purchase")
5. **Expect**: The order summary reflects the discount

**Command**:
```
Click "$10 Off Your Order" in the loyalty panel
```

---

### VS-3: Switch reward selection

**Given**: A reward is currently selected

1. Click a different reward option (e.g., "$5 Off — 500 pts")
2. **Expect**: The previously selected reward deselects (loses gold border)
3. **Expect**: The new reward selects (gains gold border)
4. **Expect**: Points remaining updates accordingly

**Command**:
```
Click a different reward option
```

---

### VS-4: Deselect a reward

**Given**: A reward is currently selected

1. Click the currently selected reward option again
2. **Expect**: The reward deselects (loses gold border, circle becomes empty)
3. **Expect**: The "Selected" badge disappears
4. **Expect**: The panel footer shows full points balance again

**Command**:
```
Click the selected reward option again
```

---

### VS-5: Unaffordable rewards are visually distinguished

**Given**: Loyalty panel visible, customer balance is 100 points, reward tier costs 500 points

1. View the reward option costing 500 points
2. **Expect**: The option is grayed out or reduced opacity (not clickable)
3. **Expect**: The option has no hover/click feedback

**Command**: (set up via Square Sandbox — reduce loyalty account balance)
```
View the cart with a low-balance account
```

---

### VS-6: Error state — loyalty API failure

**Given**: Cart page loads but Square Loyalty API is unreachable

1. Navigate to `/cart`
2. **Expect**: Cart items and order summary render normally
3. **Expect**: Loyalty panel shows "Rewards unavailable" with a "Try again" button
4. Click "Try again"
5. **Expect**: Panel attempts to reload loyalty data

**Command**: (simulate by temporarily removing `SQUARE_LOYALTY_PROGRAM_ID` or disconnecting network)
```
Open /cart while Square API is unreachable
```

---

### VS-7: Responsive layout at different breakpoints

**Given**: Cart page with loyalty panel visible

1. Resize browser to 1280px (lg)
   - **Expect**: Panel spans full cart column width, reward options in vertical list
2. Resize to 768px (md)
   - **Expect**: Panel adapts to narrower column, text readable, touch targets accessible
3. Resize to 375px (sm)
   - **Expect**: Panel fills viewport width, reward rows stack, touch targets ≥44px

**Command**:
```
Resize browser to 1280px, 768px, 375px — verify layout at each
```

---

### VS-8: Rapid clicks don't create duplicate rewards

**Given**: Loyalty panel visible

1. Rapidly click two different reward options in quick succession
2. **Expect**: Only the last clicked reward is selected
3. **Expect**: No duplicate rewards on the order
4. **Expect**: No error messages from rapid clicking

**Command**:
```
Click reward A, immediately click reward B — verify only B is selected
```

---

### VS-9: No loyalty account — panel hidden

**Given**: Authenticated user with Square customer but NO loyalty account and items in cart

1. Navigate to `/cart`
2. **Expect**: Cart items and order summary render normally
3. **Expect**: No loyalty panel is visible (silently omitted)

**Command**: (use a test account that has Square customer but was created without phone number — loyalty enrollment skipped)
```
Open /cart with a non-loyalty account
```

---

### VS-10: Earned points notice in order summary

**Given**: Loyalty panel visible with items in cart

1. View the order summary sidebar (right column on desktop)
2. **Expect**: Below the checkout button, a notice reads "You'll earn {N} points on this order"
3. **Expect**: The point count is in gold/bold text

**Command**:
```
View the order summary sidebar on the cart page
```

---

## Automated Test Commands

```bash
# TypeScript check
tsc --noEmit

# Lint
npm run lint

# Unit + Integration tests
npm test -- --run

# Run only loyalty-related tests
npm test -- --run --grep "loyalty"

# E2E (critical path: cart with reward selection)
npm run test:e2e
```

## Expected Outcomes Summary

| Scenario | Expected |
|----------|----------|
| Cart page load with loyalty | Panel visible in <3s with points balance |
| Select reward | Gold border, filled circle, "Selected" badge, remaining points update |
| Switch reward | Previous deselects, new selects — single selection maintained |
| Deselect reward | Visual state resets, full balance restored |
| Unaffordable reward | Grayed out, not clickable |
| API failure | Inline error + "Try again" button; cart unaffected |
| Responsive layout | Correct at 1280px, 768px, 375px |
| Rapid clicks | No duplicates, last click wins |
| No loyalty account | Panel hidden |
| Earned points notice | Points estimate visible in order summary |
