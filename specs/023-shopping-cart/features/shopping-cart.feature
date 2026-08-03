Feature: Shopping Cart
  As a logged-in customer
  I want to add products to a cart and manage my selections
  So that I can collect items for purchase before checkout

  Background:
    Given a customer is logged in with a valid Square customer ID

  # ============================================================================
  # User Story 1 — Add Item to Cart from Product Page
  # Priority: P1 — MVP
  # ============================================================================

  @US1 @add-to-cart @priority-p1
  Scenario: Add an in-stock product to cart
    Given a logged-in customer on a product page for an in-stock product
    And the customer has selected a valid quantity
    When they click "Add to Cart"
    Then the product with the chosen quantity is added to a Square draft order
    And a confirmation indicator is shown

  @US1 @add-to-cart @priority-p1
  Scenario: Increment quantity when adding same product again
    Given a logged-in customer with an existing cart containing a product
    When they click "Add to Cart" on the same product again
    Then the line item quantity is incremented in the draft order
    And no duplicate line item is created

  @US1 @add-to-cart @priority-p1
  Scenario: Out of stock product shows disabled button
    Given a logged-in customer on a product page for an out-of-stock product
    When they view the page
    Then the button displays "Out of Stock" instead of "Add to Cart"
    And the button is disabled

  @US1 @add-to-cart @priority-p1
  Scenario: Unauthenticated user is redirected to sign in
    Given a user who is not logged in
    When they attempt to add an item to the cart
    Then they are prompted to sign in first
    And after signing in the item is added to their cart

  # ============================================================================
  # User Story 2 — View Cart with Line Items and Totals
  # Priority: P1 — MVP
  # ============================================================================

  @US2 @view-cart @priority-p1
  Scenario: View cart with multiple line items
    Given a logged-in customer with items in their cart
    When they visit the cart page
    Then all line items are displayed with product name, quantity, unit price, and line total
    And a subtotal of all items is shown at the bottom

  @US2 @view-cart @priority-p1
  Scenario: Empty cart shows empty state message
    Given a logged-in customer with an empty cart
    When they visit the cart page
    Then an empty state message "Your cart is empty" is displayed
    And a link to browse products is shown

  @US2 @view-cart @priority-p1
  Scenario: Unavailable product in cart is flagged
    Given a logged-in customer with a cart containing a product
    When that product becomes unavailable or out of stock
    And the customer visits the cart page
    Then the line item is flagged with an unavailable indicator
    And the customer cannot proceed to checkout until it is resolved

  # ============================================================================
  # User Story 3 — Update Quantity and Remove Items
  # Priority: P2
  # ============================================================================

  @US3 @manage-cart @priority-p2
  Scenario: Update line item quantity
    Given a logged-in customer viewing their cart with items
    When they change a line item quantity to a value between 1 and available stock
    Then the quantity is updated in the Square order
    And the line total and subtotal reflect the change

  @US3 @manage-cart @priority-p2
  Scenario: Remove an item from the cart
    Given a logged-in customer viewing their cart with items
    When they click "Remove" on a line item or set quantity to zero
    Then the item is removed from the Square order
    And the item disappears from the cart view
    And the subtotal recalculates

  @US3 @manage-cart @priority-p2
  Scenario: Quantity update failure reverts to previous state
    Given a logged-in customer viewing their cart
    When a quantity update fails due to a backend error
    Then the quantity reverts to its previous value
    And an error message is displayed

  # ============================================================================
  # Edge Cases
  # ============================================================================

  @edge @error-handling
  Scenario: Cart persists across sign-out and sign-in
    Given a logged-in customer with items in their cart
    When they sign out and sign back in
    Then their cart items reappear from the existing Square draft order

  @edge @error-handling
  Scenario: Square API is unreachable during add-to-cart
    Given a logged-in customer on a product page
    When the Square API is unreachable and they click "Add to Cart"
    Then an error message is displayed
    And the item is not added to the cart
    And the previous cart state is preserved

  @edge @error-handling
  Scenario: Invalid quantity input is rejected
    Given a logged-in customer interacting with the quantity input
    When they enter a value of zero or a negative number
    Then the system rejects the value before sending to the API
    And the UI prevents submission with an invalid quantity
