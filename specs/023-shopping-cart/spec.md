# Feature Specification: Shopping Cart

**Feature Branch**: `023-shopping-cart`

**Created**: 2026-08-03

**Status**: Draft

**Input**: User description: "as a user I want to add items to my cart powered by squares order api's."

## Clarifications

### Session 2026-08-03

- Q: When clicking "Add to Cart" on a GameCard (listing/search/related) for a product with multiple variations, what should happen? → A: Navigate to the product detail page so the user can select a variation first.
- Q: What should the cart page display while cart data is being fetched from Square on initial page load? → A: Show skeleton placeholders (gray rectangles) for line items and totals while loading.
- Q: How should the system handle a customer with the same cart open in two browser tabs simultaneously? → A: Last write wins — each tab independently reads and writes the cart; whichever submits last overwrites. No cross-tab coordination.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add Item to Cart from Product Page (Priority: P1)

A customer browsing a product clicks "Add to Cart". The item is added to their cart (a Square draft order). They see immediate confirmation that the item was added and can continue shopping.

**Why this priority**: This is the core action that makes the cart exist. Without it, no other cart functionality matters. It directly enables the shopping flow.

**Independent Test**: Navigate to any product page, click "Add to Cart", and verify a Square draft order is created (or updated) with the product as a line item. The "Add to Cart" button shows a success state.

**Acceptance Scenarios**:

1. **Given** a logged-in customer on a product page with an in-stock product, **When** they click "Add to Cart", **Then** the selected product with the chosen quantity is added to a Square draft order and a confirmation toast or indicator is shown
2. **Given** a logged-in customer with an existing cart (draft order) for the same product, **When** they click "Add to Cart" again on that product, **Then** the line item quantity in the existing draft order is incremented instead of creating a duplicate line item
3. **Given** a logged-in customer on a product page for an out-of-stock product, **When** they view the page, **Then** the "Add to Cart" button is replaced with "Out of Stock" and is disabled
4. **Given** a user who is NOT logged in, **When** they try to add an item to the cart, **Then** they are prompted to sign in first, and after signing in the item is added to their cart

---

### User Story 2 - View Cart with Line Items and Totals (Priority: P1)

A customer navigates to the cart page and sees all items they have added, each showing the product name, quantity, individual price, and line total, along with a cart subtotal.

**Why this priority**: Customers need to review their selections before checking out. This is the cart's primary display function and is essential alongside adding items.

**Independent Test**: Add two different products to the cart, navigate to `/cart`, and verify both products appear with correct names, quantities, prices, and the correct subtotal.

**Acceptance Scenarios**:

1. **Given** a logged-in customer with items in their cart, **When** they visit the cart page, **Then** all line items are displayed with product name, quantity, unit price, and line total; and a subtotal of all items is shown at the bottom
2. **Given** a logged-in customer with an empty cart, **When** they visit the cart page, **Then** an empty state message is shown ("Your cart is empty") with a link to browse products
3. **Given** a logged-in customer with a cart, **When** a product in their cart is no longer available or out of stock, **Then** that line item is flagged with an unavailable indicator and cannot proceed to checkout until resolved

---

### User Story 3 - Update Quantity and Remove Items (Priority: P2)

A customer views their cart and adjusts the quantity of a line item or removes an item entirely. The cart totals update dynamically.

**Why this priority**: Cart management is essential but can be delivered as a fast-follow after the core add-to-cart and cart-view flows work. The MVP cart still functions without inline editing if users can add and view items.

**Independent Test**: View a cart with at least one item. Increase its quantity and verify the line total and cart subtotal update. Remove an item and verify it disappears and the subtotal recalculates.

**Acceptance Scenarios**:

1. **Given** a logged-in customer viewing their cart with items, **When** they change a line item quantity to a value between 1 and the available stock, **Then** the quantity is updated in the Square order and the line total and subtotal reflect the change
2. **Given** a logged-in customer viewing their cart with items, **When** they change a line item quantity to 0 or click "Remove", **Then** the item is removed from the Square order and disappears from the cart view
3. **Given** a logged-in customer viewing their cart, **When** a quantity update fails (e.g., Square API error), **Then** the quantity reverts to its previous value and an error message is displayed

---

### Edge Cases

- **Adding the same product variant multiple times**: The quantity is incremented on the existing line item rather than creating a duplicate.
- **Invalid quantity values (0, negative, non-numeric)**: The system rejects these values before sending to the API; the UI prevents entry of invalid quantities.
- **Product goes out of stock after being added to cart**: The cart item displays an "unavailable" flag on next page load. The user can remove the item but cannot checkout until resolved.
- **Customer signs out with items in cart**: The draft order remains in Square associated with the customer. Items reappear when the customer signs back in.
- **Square API is unreachable during add-to-cart**: An error message is displayed to the user and the item is not added. The previous cart state is preserved.
- **"Add to Cart" on listing cards for variation products**: When a product has multiple variations (e.g., different sizes) and is displayed on a listing page without a variation selector, clicking "Add to Cart" navigates to the product detail page where the user selects a variation first.
- **Cart open in two browser tabs**: Both tabs read/write the same Square draft order independently. The last write wins; no cross-tab synchronization. Customers should avoid editing the cart in multiple tabs simultaneously.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create or update a Square draft order when a logged-in customer clicks "Add to Cart" on a product page
- **FR-002**: System MUST increment line item quantity when adding a product already present in the cart draft order
- **FR-003**: System MUST display a visual confirmation (toast or button state change) after a successful add-to-cart action
- **FR-004**: System MUST show "Out of Stock" instead of "Add to Cart" on product pages for unavailable products
- **FR-005**: System MUST require authentication before allowing cart operations; unauthenticated users MUST be redirected to sign in
- **FR-006**: System MUST display all cart line items on the cart page with product name, quantity, unit price, and line total
- **FR-007**: System MUST calculate and display the cart subtotal as the sum of all line item totals
- **FR-008**: System MUST display skeleton placeholders on the cart page while cart data loads from Square
- **FR-009**: System MUST flag line items for products that have become unavailable since being added to the cart
- **FR-010**: System MUST allow authenticated customers to update line item quantities (within valid range 1 to available stock)
- **FR-011**: System MUST allow authenticated customers to remove individual line items from the cart
- **FR-012**: System MUST revert to previous cart state and display an error message if a cart mutation fails
- **FR-013**: System MUST navigate to the product detail page when "Add to Cart" is clicked on a listing card (GameCard) for a product with multiple variations; products without variations on listing cards add directly to cart

### Key Entities

- **Cart (Square Draft Order)**: A Square Order in `DRAFT` state associated with a customer. Contains `lineItems`, each representing a product in the cart. Persisted in Square across sessions.
- **Line Item**: A single entry in the cart representing one product type. Has `catalogObjectId` (product reference), `quantity` (as string), and `basePriceMoney` (unit price). The line total is `quantity * unit price`.
- **Cart Subtotal**: The sum of all line item totals (`lineTotalMoney`) before taxes, discounts, or shipping.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Customers can add an item to their cart and see confirmation within 2 seconds of clicking "Add to Cart"
- **SC-002**: Customers can add the same product twice and see quantity increment rather than a duplicate line item on their first attempt
- **SC-003**: The cart page displays all items and the correct subtotal on first load with zero data errors
- **SC-004**: 100% of quantity updates and item removals are accurately reflected in both the UI and the Square order

## Assumptions

- Customers must be logged in to use the cart; guest checkout is out of scope for this feature. Existing authentication via Square Customer API is reused.
- The Square Orders API client (`ordersApi`) is already initialized and configured in `lib/square/client.ts`.
- Cart data is sourced from a single draft order per customer. If a customer already has a draft order, it is reused; if not, one is created on first "Add to Cart".
- Quantity picker component already exists on the product detail page and provides a valid integer between 1 and available stock.
- The cart page will live at `/cart` and be a new page in the app.
- Product availability (in-stock/out-of-stock) is determined from Square catalog data already fetched by the product page.
- "Add to Cart" buttons currently exist on product detail and game card components but have no wired functionality. GameCards for products without variations will add directly to cart; GameCards for products with variations will navigate to the product detail page.
- Pricing, taxes, and shipping calculations are out of scope — these are handled at checkout, not in the cart.
- Checkout flow (converting draft order to a placed order) is a separate feature and out of scope.
