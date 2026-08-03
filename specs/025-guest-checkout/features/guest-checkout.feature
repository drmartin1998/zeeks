Feature: Guest Cart and Checkout
  As an unauthenticated visitor
  I want to add items to a cart and checkout completely
  So that I can make purchases without creating an account

  @US1
  Scenario: Guest adds first item to cart
    Given an unauthenticated visitor is on a product page
    When they click "Add to Cart"
    Then the item is added to a guest cart with the selected quantity
    And a visual confirmation is shown

  @US1
  Scenario: Guest views cart with multiple items
    Given an unauthenticated visitor has added multiple items to their guest cart
    When they navigate to "/cart"
    Then they see all line items with product names, quantities, individual prices, and a subtotal
    And the cart layout matches the authenticated cart experience

  @US1
  Scenario: Guest cart persists across browser refresh
    Given an unauthenticated visitor has items in their guest cart
    When they close the browser tab and reopen the store
    Then their cart items are still present

  @US1
  Scenario: Guest adjusts quantities or removes items
    Given an unauthenticated visitor has items in their guest cart
    When they adjust the quantity of an item or remove an item
    Then the cart updates immediately and reflects the new state

  @US2
  Scenario: Guest initiates checkout from cart
    Given an unauthenticated visitor has a non-empty guest cart
    When they click "Proceed to Checkout" on the cart page
    Then a Square order is created from the cart items
    And a payment link is generated
    And the visitor is redirected to the Square-hosted payment page

  @US2
  Scenario: Guest returns from successful payment
    Given an unauthenticated visitor has completed payment on the Square payment page
    When Square redirects them back to "/order/result?status=COMPLETED&transactionId=..."
    Then they see an order confirmation with the transaction ID and purchased items

  @US2
  Scenario: Guest cart with unavailable items disables checkout
    Given an unauthenticated visitor has a guest cart containing an unavailable item
    When they view the cart page
    Then the "Proceed to Checkout" button is disabled
    And an explanatory message is displayed

  @US3
  Scenario: Guest signs in and cart transfers
    Given an unauthenticated visitor has a guest cart containing items
    When they sign in via Clerk
    Then their guest cart items are transferred to their authenticated cart
    And the guest cart is cleared

  @US3
  Scenario: Guest signs in with existing authenticated cart
    Given an unauthenticated visitor has a guest cart containing items
    And the authenticated customer already has items in their cart
    When the visitor signs in
    Then the guest cart items are merged into the existing authenticated cart
    And duplicate items have their quantities summed

  @US4
  Scenario: Guest cart expires after inactivity
    Given an unauthenticated visitor has an abandoned guest cart
    And the cart has not been modified for the defined expiry period
    When they visit the store again
    Then the cart is empty

  @US4
  Scenario: Guest manually clears cart
    Given an unauthenticated visitor has a guest cart with items
    When they click "Clear Cart"
    Then all items are removed immediately
    And the cart shows an empty state
