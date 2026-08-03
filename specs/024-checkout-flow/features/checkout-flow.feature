Feature: Square Checkout Flow
  As a customer
  I want to click checkout from the shopping cart
  So that I can complete my order on the Square payment page

  @US1
  Scenario: Successful checkout from cart
    Given a logged-in customer with items in their cart
    And all cart items are in stock
    When they click the "Checkout" button on the cart page
    Then a Square payment link is generated with a unique idempotency key
    And the payment link references the correct order total matching the cart subtotal
    And they are redirected to the Square-hosted payment page

  @US1
  Scenario: Checkout button disabled for unavailable items
    Given a logged-in customer with items in their cart
    And at least one cart item is flagged as unavailable
    When they view the cart page
    Then the "Checkout" button is visually grayed out
    And the "Checkout" button ignores click, tap, and keyboard activation
    And a message explains that unavailable items must be removed before checking out

  @US1
  Scenario: Checkout button shows loading state during processing
    Given a logged-in customer with items in their cart
    When they click the "Checkout" button
    Then the button is immediately disabled to prevent duplicate clicks
    And a loading indicator with "Redirecting to checkout..." text replaces the button

  @US2
  Scenario: Checkout handles Square API server error
    Given a logged-in customer with items in their cart
    When they click the "Checkout" button
    And the Square API returns a server error (5xx) during payment link generation
    Then they remain on the cart page
    And a message is displayed indicating a temporary issue and suggesting retry
    And their cart is preserved unchanged

  @US2
  Scenario: Checkout handles Square API client error
    Given a logged-in customer with items in their cart
    When they click the "Checkout" button
    And the Square API returns a client error (4xx)
    Then they remain on the cart page
    And a specific message indicates the issue
    And their cart is preserved unchanged

  @US2
  Scenario: Cannot checkout with empty cart
    Given a logged-in customer with an empty cart
    When they attempt to submit the checkout form
    Then they are redirected back to the cart page
    And a message indicates the cart is empty

  @US2
  Scenario: Authentication expires during checkout
    Given a customer whose authentication session has expired
    When they submit the checkout action
    Then they are redirected to the sign-in page
    And after signing in, their cart items remain available

  @US3
  Scenario: Successful return from Square payment
    Given a customer who has completed payment on the Square payment page
    When Square redirects them back to the store with status=COMPLETED and transactionId
    Then they see an order confirmation page
    And the confirmation page shows the transaction ID as the order reference
    And the confirmation page shows a summary of items purchased
    And a "Continue Shopping" link is displayed

  @US3
  Scenario: Cancelled return from Square payment
    Given a customer who cancelled payment on the Square payment page
    When Square redirects them back to the store with status=CANCELLED
    Then they see a message indicating payment was not completed and no charge was made
    And a "Return to Cart" link is displayed
    And the same draft order items remain available

  @US3
  Scenario: Return from Square with missing status parameters
    Given a customer returning from the Square payment page
    When the return page receives missing or unrecognized status parameters
    Then they see a generic order status message
    And a "View Orders" link is displayed
    And no error is shown
