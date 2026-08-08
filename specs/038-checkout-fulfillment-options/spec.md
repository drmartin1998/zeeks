# Feature Specification: Checkout Fulfillment Options

**Feature Branch**: `038-checkout-fulfillment-options`

**Created**: 2026-08-07

**Status**: Draft

**Input**: User description: "a user should be able to pick from shipping or pickup while checking out. researching which page is best to do this and design an area to pick from pickup or shipping including shipping address entry when shipping is chosen. then update the confirmation page and emails to reflect this."

## Clarifications

### Session 2026-08-07

- Q: Should shipping have a cost, and if so, how should it be determined? → A: Shipping cost is calculated based on the order.
- Q: What should the calculated shipping cost be based on? → A: Order subtotal amount, using a tiered fee by order value.
- Q: For pickup orders, should the confirmation and email include estimated pickup timing or instructions? → A: Show the store's operating hours and a "ready for pickup" note (no specific pickup time).
- Q: Should the shipping address be allowed to default from the billing address, or always entered separately? → A: Offer a "same as billing" option that pre-fills the shipping address from the billing details.
- Q: Should the shipping/pickup selection be a separate checkout step or an inline section? → A: An inline section on the existing checkout page, above the payment form.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose Shipping or Pickup at Checkout (Priority: P1)

During checkout, a customer chooses how they want to receive their order: **shipping** (delivered to an address) or **pickup** (collected in store). When they select shipping, a shipping-address form appears for them to enter the delivery address. When they select pickup, no address is needed. The choice is clear and the customer can switch between the two before completing the order.

**Why this priority**: Choosing a fulfillment method is a required part of any order and directly affects what delivery details are collected. It is the core of this feature and must work for every checkout, so it is P1.

**Independent Test**: Can be fully tested by starting a checkout, selecting "shipping," entering a shipping address, then switching to "pickup" and verifying the address form is hidden and the choice is recorded.

**Acceptance Scenarios**:

1. **Given** a customer is at checkout, **When** they view the fulfillment section, **Then** they can choose between "Shipping" and "Pickup."
2. **Given** the customer selects "Shipping," **When** they proceed, **Then** a shipping-address form appears for them to enter the delivery address.
3. **Given** the customer selects "Pickup," **When** they proceed, **Then** no shipping-address form is shown and pickup is selected as the fulfillment method.
4. **Given** a customer has chosen a fulfillment method, **When** they switch to the other method before completing the order, **Then** the form updates accordingly without losing the rest of their checkout details.

---

### User Story 2 - Capture the Shipping Address (Priority: P1)

When a customer chooses shipping, the system collects the shipping address (recipient name, street address, city, state, postal code). The address is validated and included with the order so it can be used for delivery.

**Why this priority**: The shipping address is essential for any delivered order. Collecting and validating it correctly prevents undeliverable orders, so it is P1.

**Independent Test**: Can be fully tested by selecting shipping, entering an address, and verifying it is captured and validated (required fields, valid state/postal format).

**Acceptance Scenarios**:

1. **Given** a customer selects shipping, **When** they enter a shipping address, **Then** the recipient name, street address, city, state, and postal code are collected.
2. **Given** a shipping address is entered, **When** a required field is left blank or invalid, **Then** the customer is prompted to correct it before completing the order.
3. **Given** a valid shipping address, **When** the order completes, **Then** the shipping address is stored with the order.

---

### User Story 3 - Confirmation and Email Reflect the Fulfillment Method (Priority: P2)

After the order is confirmed, the confirmation page and the order-confirmation email reflect the chosen fulfillment method. For shipping, they show the shipping address; for pickup, they show that the order is for pickup (e.g., the store location).

**Why this priority**: The customer needs to see delivery details (the address or pickup instructions) after ordering. This is important for a complete experience but builds on the fulfillment selection, so it is P2.

**Independent Test**: Can be fully tested by completing a shipping order and a pickup order and verifying the confirmation page and email show the correct fulfillment method and address.

**Acceptance Scenarios**:

1. **Given** an order was fulfilled by shipping, **When** the confirmation page and email are shown, **Then** they display the shipping address.
2. **Given** an order was fulfilled by pickup, **When** the confirmation page and email are shown, **Then** they display that the order is for pickup (with the store location).
3. **Given** any completed order, **When** the customer views confirmation, **Then** the fulfillment method (shipping or pickup) is clearly indicated.

---

### Edge Cases

- What happens if the customer switches from shipping to pickup with a partially-entered address? The address is discarded from the final order (or the pickup method is used with no address).
- What happens if the shipping address is incomplete when the order is submitted? The customer is prevented from completing the order until the required fields are valid.
- What happens if the store location is unavailable for pickup? The pickup option should indicate the default store location or be disabled with a clear message.
- What happens with a guest checkout? The fulfillment choice and shipping address (if shipping) are captured the same way as for signed-in customers.
- What happens if an order has both shipping and pickup details? Only the chosen method's details should be stored; the other is not.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: During checkout, the customer MUST be able to choose between "Shipping" and "Pickup."
- **FR-002**: When "Shipping" is selected, the system MUST present a shipping-address form (recipient name, street address, city, state, postal code), with a "same as billing" option that pre-fills the address from the billing details.
- **FR-003**: When "Pickup" is selected, the system MUST NOT require a shipping address and MUST record pickup as the fulfillment method.
- **FR-004**: The customer MUST be able to switch between shipping and pickup before completing the order.
- **FR-005**: The shipping address MUST be validated (required fields, valid state and postal code format) before the order can be completed.
- **FR-006**: The chosen fulfillment method and, for shipping, the shipping address MUST be stored with the order.
- **FR-007**: The order confirmation page MUST reflect the chosen fulfillment method, showing the shipping address for shipping orders or the store location, operating hours, and a "ready for pickup" note for pickup orders.
- **FR-008**: The order-confirmation email MUST reflect the chosen fulfillment method, showing the shipping address for shipping orders or the store location, operating hours, and a "ready for pickup" note for pickup orders.
- **FR-009**: The fulfillment selection MUST work for both guest and signed-in checkout.
- **FR-010**: When shipping is selected, the system MUST calculate and display a shipping cost based on the order subtotal (tiered by order value), and include it in the order total.
- **FR-011**: The shipping/pickup selection MUST be presented as an inline section on the checkout page, above the payment form.

### Key Entities *(include if feature involves data)*

- **Fulfillment Method**: The chosen delivery method — either "shipping" or "pickup."
- **Shipping Address**: The delivery address (recipient name, street, city, state, postal code) captured when shipping is chosen.
- **Order Fulfillment**: The fulfillment details attached to the order (method + address for shipping, or pickup location for pickup).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of checkouts present a clear shipping/pickup choice before completion.
- **SC-002**: A customer can complete the fulfillment selection and required address entry in under 2 minutes.
- **SC-003**: 100% of completed shipped orders include a validated shipping address.
- **SC-004**: 100% of order confirmation pages and emails clearly indicate the fulfillment method and, for shipping, the shipping address.

## Assumptions

- The fulfillment selection is an inline section on the existing checkout page, placed above the payment form (the natural point where order details are finalized).
- Pickup uses a single default store location (the store's existing location); no multi-location selection is in scope for v1. Pickup confirmation shows the store location, operating hours, and a "ready for pickup" note.
- The shipping address fields are standard US address fields (recipient, street, city, state, postal code).
- The shipping address may be reused for/with the billing address via a "same as billing" option that pre-fills the shipping address from the billing details.
- Shipping cost is calculated from the order subtotal using tiered rates by order value; the specific tier thresholds and amounts are configurable constants.
- The order confirmation email already exists (feature 037) and will be extended to include the fulfillment method and (for shipping) the address.