Feature: Custom Checkout Page Flow
  As a customer with items in my cart
  I want to complete my purchase on a checkout page within the store
  So that I can see my order summary, applied loyalty rewards, and pay without leaving the store

  Background:
    Given I am authenticated as a customer with items in my cart

  @US1_complete-order
  Scenario: Navigate to checkout and see order summary with payment form
    Given I have items in my cart and a loyalty reward selected
    When I click "Proceed to Checkout"
    Then I am taken to the checkout page
    And the order summary displays my items with quantities and prices
    And the applied reward discount is shown as a visible line item
    And a payment form is displayed

  @US1_complete-order
  Scenario: Complete payment successfully
    Given I am on the checkout page with valid payment information entered
    When I submit the payment
    Then the payment is processed
    And I am redirected to an order confirmation page showing the transaction details

  @US1_complete-order
  Scenario: Payment validation error
    Given I am on the checkout page
    When I submit with invalid card information
    Then a specific error message is displayed next to the invalid field
    And the form is not cleared
    And I can correct and retry

  @US1_complete-order
  Scenario: Checkout without loyalty reward
    Given I have items in my cart but no loyalty reward selected
    When I proceed to checkout
    Then the checkout page shows the order summary without any reward discount line items

  @US2_reward-on-checkout
  Scenario: Fixed discount reward displayed on checkout
    Given I have a "$10 Off Your Order" reward selected and items totaling $50
    When I view the checkout page
    Then the order summary shows the subtotal
    And a reward discount line item of "-$10.00" is displayed
    And the final total is $40.00

  @US2_reward-on-checkout
  Scenario: Points remaining shown on checkout
    Given I have a loyalty reward selected and proceed to checkout
    When the checkout page displays
    Then the points remaining after purchase is shown below the order summary

  @US2_reward-on-checkout
  Scenario: Percentage discount reward on checkout
    Given I have a percentage-based loyalty reward selected
    When I view the checkout page
    Then the discount amount is calculated and displayed as a line item

  @US3_customer-info
  Scenario: Customer information is pre-populated
    Given I am a logged-in customer with saved profile information
    When I navigate to the checkout page
    Then my name and email address are displayed on the page

  @US3_customer-info
  Scenario: Navigate to update incorrect information
    Given the checkout page displays my customer information
    When the information is incorrect
    Then I can navigate to my account settings to update it before completing the purchase

  @edge_payment-failure
  Scenario: Payment declined due to insufficient funds
    Given I am on the checkout page
    When my payment is declined
    Then the decline reason is shown inline
    And the order is not completed
    And I can try a different payment method

  @edge_duplicate-payment
  Scenario: Double-click protection
    Given I am on the checkout page
    When I click the Pay button
    Then the button is immediately disabled
    And no duplicate payment can be submitted

  @edge_reward-no-longer-available
  Scenario: Loyalty reward removed before checkout completion
    Given I proceed to checkout with a loyalty reward selected
    When the reward is no longer available
    Then the checkout page shows the order total without the discount
    And a notification informs me the reward is no longer available

  @edge_guest-checkout
  Scenario: Guest checkout without loyalty rewards
    Given I am a guest customer with items in my cart
    When I proceed to checkout
    Then the checkout page shows the order summary and payment form
    And customer information and loyalty reward sections are not displayed

  @edge_responsive
  Scenario: Checkout page adapts to mobile
    Given I am on a phone with a 375px viewport
    When I view the checkout page
    Then the order summary and payment form are stacked vertically
    And all touch targets are at least 44px tall
