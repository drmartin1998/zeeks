# Feature Specification: Rewards Redemption

**Feature Branch**: `027-rewards-redemption`

**Created**: 2026-08-04

**Status**: Draft

**Input**: User description: "as a logged in user I want to view my rewards points and select up to a single reward to redeem from my existing rewards. Use the Figma design for the cart standard, lg, md, and sm to find the new rewards redemtpion design and implement the design. Pull the users actual available rewards from Square."

## Clarifications

### Session 2026-08-04

- Q: Where should the rewards redemption UI be located — standalone sub-page at `/account/rewards` or embedded in the dashboard? → A: On the cart page, following the Figma design for cart standard/lg/md/sm. The Figma MCP should be used to locate the new rewards redemption and selection design elements within the cart designs.
- Q: What should the cart page show in the loyalty panel area while loyalty data is being fetched from Square? → A: A skeleton placeholder matching the panel shape renders immediately; content replaces it when data loads. This matches the existing cart skeleton pattern and avoids layout shift.
- Q: When the loyalty API fails during initial cart page load, should the loyalty panel show a manual retry button, attempt an automatic retry, or both? → A: Manual retry only — inline error message with a "Try again" button; customer clicks to retry. No automatic retry loop.
- Q: How should the earned-points notice in the order summary be calculated — via Square's calculateLoyaltyPoints API or as a client-side estimate? → A: Use Square's `calculateLoyaltyPoints` API with the order ID and loyalty account ID for an accurate, program-aware estimate.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Rewards Points and Available Rewards (Priority: P1)

As a logged-in customer viewing the cart, I want to see my current loyalty points balance and the list of rewards I can apply to this order, so I can decide whether to redeem points for a discount.

**Why this priority**: Customers need to see their rewards status before they can decide to redeem anything. The cart is the natural place to apply rewards — it's where purchase decisions happen.

**Independent Test**: Log in with a test customer that has a Square loyalty account with 4,280 points. Add items to the cart and view the cart page. Verify the loyalty panel appears below the cart items, showing the customer's point balance and all reward tiers with their point costs.

**Acceptance Scenarios**:

1. **Given** a logged-in customer with a Square loyalty account holding 4,280 points and items in their cart, **When** they view the cart page, **Then** a loyalty panel ("Squares Loyalty") is rendered below the cart items showing their current point balance as a large metric (e.g., "4,280 points available") and the customer's membership tier
2. **Given** a logged-in customer with a loyalty account viewing the cart, **When** reward tiers exist in the loyalty program, **Then** all reward tiers are listed with their name, description (e.g., "$10 Off Your Order — Redeem for 1,000 pts"), and point cost, displayed as selectable radio-style options
3. **Given** a logged-in customer with no loyalty accounts and items in their cart, **When** they view the cart page, **Then** the loyalty panel is not rendered (no empty state — the panel is conditionally displayed)
4. **Given** a logged-in customer with a loyalty account that has fewer points than all reward tiers, **When** they view the cart page, **Then** all reward tiers are shown but visually distinguished as unaffordable (lower opacity or grayed out)

---

### User Story 2 - Select a Reward to Apply to the Order (Priority: P1)

As a logged-in customer with enough points, I want to select a single reward from the loyalty panel on the cart page and apply its discount to my current order, so I can save money on this purchase.

**Why this priority**: Applying a reward discount is the primary action — the panel's entire purpose is to let customers redeem points for order discounts at checkout time.

**Independent Test**: Log in with a test customer that has 4,280 points. Add items to cart. In the loyalty panel, click a reward option (e.g., "$10 Off — 1,000 pts"). Verify the reward is visually selected (gold border, filled radio circle, "Selected" badge appears), the order summary reflects the discount, and remaining points are shown in the panel footer.

**Acceptance Scenarios**:

1. **Given** a logged-in customer viewing the cart with 4,280 points and unselected rewards, **When** they click on a reward option (e.g., "$10 Off Your Order — 1,000 pts"), **Then** that reward is visually selected with a gold border and filled radio circle, a "Selected" badge appears on the reward row, and the points remaining after selection are shown in the footer (e.g., "3,280 points remaining after purchase")
2. **Given** a logged-in customer has a reward selected, **When** they click a different reward option, **Then** the previously selected reward is deselected and the new one is selected (only one reward active at a time)
3. **Given** a logged-in customer has a reward selected, **When** they click the selected reward again, **Then** the reward is deselected and the discount is removed from the order
4. **Given** a logged-in customer with enough points selects a reward, **When** the Square API creates the loyalty reward successfully, **Then** the reward discount is applied to the order and the points remaining footer updates accordingly
5. **Given** a logged-in customer selects a reward but the Square API returns an error, **Then** an error message is displayed inline within the loyalty panel, the reward selection reverts, and no discount is applied

---

### User Story 3 - Responsive Loyalty Panel on Cart (Priority: P2)

As a customer using any device, I want the loyalty rewards panel on the cart page to be usable and visually clear whether I'm on a desktop, tablet, or phone.

**Why this priority**: The cart-standard responsive design (lg, md, sm breakpoints) from the Figma spec defines how the loyalty panel adapts. A broken mobile layout prevents customers from selecting rewards on their phones.

**Independent Test**: View the cart page with items at viewport widths of 1280px (lg), 768px (md), and 375px (sm). Verify the loyalty panel layout adapts correctly — on desktop the panel sits in the main cart column; on mobile it stacks between cart items and the order summary.

**Acceptance Scenarios**:

1. **Given** the cart page at desktop width (lg), **When** the customer views the loyalty panel, **Then** the panel spans the full width of the cart items column (800px) with reward options displayed in a vertical list
2. **Given** the cart page at tablet width (md), **When** the customer views the loyalty panel, **Then** the panel adapts to the narrower cart column while maintaining readable text and tappable reward selection areas
3. **Given** the cart page at mobile width (sm), **When** the customer views the loyalty panel, **Then** reward options stack vertically with the panel filling the available viewport width, and all touch targets are at least 44px tall
4. **Given** the cart page, **When** the customer resizes between breakpoints, **Then** the loyalty panel transitions smoothly without content overflow or overlap

---

### Edge Cases

- What happens when the loyalty program has no reward tiers configured? The loyalty panel is not rendered at all — no empty state shown on the cart page.
- What happens when a customer's points decrease between page load and reward selection (e.g., another redemption completes)? The system returns an error from Square ("insufficient points"), the selection is declined, and the panel shows an inline error.
- What happens when the customer refreshes the cart page after selecting a reward? The loyalty account and any existing rewards are fetched fresh from Square — no stale state.
- What happens when the loyalty program ID is not configured (`SQUARE_LOYALTY_PROGRAM_ID` missing)? The loyalty panel is not rendered on the cart page — silent omission consistent with spec 016's degradation behavior.
- What happens when the customer has multiple loyalty accounts? The first active loyalty account is used; a warning is logged.
- What happens when the loyalty API returns an error during the initial cart page load? The loyalty panel shows "Rewards unavailable" with a retry option; cart items and order summary render normally.
- What happens when a customer rapidly clicks multiple reward options before the first API call completes? The reward option click handler is disabled during in-flight API calls to prevent race conditions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Loyalty panel MUST be rendered on the cart page (`/cart`) below the cart items list, only when the customer is authenticated and has a loyalty account
- **FR-002**: Panel MUST fetch the customer's loyalty account(s) from Square via `searchLoyaltyAccounts` using the Square customer ID from Clerk privateMetadata
- **FR-003**: Panel MUST fetch the loyalty program details (including reward tiers) from Square via `retrieveLoyaltyProgram`
- **FR-004**: Panel header MUST display the Square loyalty brand header ("Squares Loyalty"), the customer's membership tier label, and current point balance as a prominent large metric (e.g., "4,280 points available")
- **FR-005**: Panel MUST list all reward tiers from the loyalty program as selectable radio-style options, each showing the reward name, description, and point cost
- **FR-006**: Reward options MUST behave as radio buttons — only one reward can be selected at a time; selecting a different reward deselects the previous one
- **FR-007**: Selected reward option MUST be visually distinguished with a gold accent border, filled radio circle, and a "Selected" badge
- **FR-008**: Unselected reward options MUST use a gray border and empty radio circle
- **FR-009**: Reward options the customer cannot afford (point cost > current balance) MUST be visually distinguished as unavailable (reduced opacity or grayed out)
- **FR-010**: Selecting a reward MUST trigger a call to Square's `createLoyaltyReward` API with the applicable `reward_tier_id`, `loyalty_account_id`, and the current `order_id`
- **FR-011**: On successful reward creation, the panel footer MUST update to show remaining points after redemption (e.g., "3,280 points remaining after purchase")
- **FR-012**: Deselecting a reward MUST call Square's `deleteLoyaltyReward` API to remove the reward from the order and restore the points display
- **FR-013**: If the customer already has an ISSUED reward on this order, the panel MUST show the reward as pre-selected on page load
- **FR-014**: Reward selection clicks MUST be throttled during in-flight API calls to prevent race conditions and duplicate creations
- **FR-015**: The loyalty panel MUST adapt responsively at lg, md, and sm breakpoints per the cart-standard Figma layout
- **FR-016**: Panel MUST degrade gracefully on API failure — the cart items and order summary render normally; the loyalty panel shows an inline error message with a manual "Try again" button (no automatic retry)
- **FR-017**: The earned-points notice ("You'll earn X points on this order") MUST be displayed in the order summary sidebar, calculated via Square's `calculateLoyaltyPoints` API using the order ID and loyalty account ID
- **FR-018**: When the loyalty program has no reward tiers or the program ID is not configured, the loyalty panel MUST NOT be rendered (silent omission)
- **FR-019**: While loyalty data is being fetched, a skeleton placeholder matching the loyalty panel shape MUST render immediately to prevent layout shift; content replaces the skeleton when data arrives

### Key Entities

- **Loyalty Account**: Represents the customer's enrollment in the loyalty program. Key attributes: account ID, current point balance, associated customer ID
- **Loyalty Program**: The store-wide program definition fetched from Square. Contains reward tiers that define what customers can redeem
- **Reward Tier**: A specific reward option within the program. Key attributes: tier ID, name, description, required point cost, reward type
- **Loyalty Reward**: The result of a redemption — a single reward created against the customer's loyalty account. Key attributes: reward ID, status (ISSUED/REDEEMED), associated tier, points used, creation timestamp

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The loyalty panel and reward tiers render within 3 seconds of the cart page load under normal network conditions
- **SC-002**: Customers can select a reward to apply to their order in under 10 seconds (click → visual confirmation)
- **SC-003**: The loyalty panel renders correctly and is fully usable at viewport widths of 375px, 768px, and 1280px
- **SC-004**: 95% of reward selection API calls that pass eligibility checks complete successfully
- **SC-005**: Race conditions from rapid reward selection clicks result in zero duplicate rewards on an order

## Assumptions

- The customer already has a Square customer record linked via Clerk privateMetadata (established in spec 008 and 015)
- The loyalty program is already configured in Square with defined reward tiers — this feature does not include program creation
- The `SQUARE_LOYALTY_PROGRAM_ID` environment variable is already validated at startup (established in spec 016)
- Rewards are selected on the cart page and applied to the current order — reward creation passes the `order_id` to Square's `createLoyaltyReward` so the discount is attached to the order
- The Figma design at `cart-standard` / `cart-lg` / `cart-md` / `cart-sm` provides the authoritative layout specification for the loyalty panel (node `167:2749` "squares-loyalty-panel"). Design tokens (colors, typography, spacing) follow the Zeeks Semantic variable collection
- Customers select rewards at the cart — the reward discount is applied to the order and visible at checkout. Selecting a different reward replaces the previous selection; deselecting removes the reward from the order
- The loyalty panel is rendered inline within the cart items column, between the last cart item and any cart actions
- Loyalty account and reward data is fetched server-side as part of the cart page's parallel data loading (consistent with Constitution I — Server Components First)
- The earned-points notice in the order summary sidebar shows the estimated points to be earned from the current order subtotal
