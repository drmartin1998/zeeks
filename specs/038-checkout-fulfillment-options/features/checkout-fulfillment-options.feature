Feature: Checkout Fulfillment Options
  As a customer
  I want to choose between shipping and pickup at checkout
  So that I receive my order the way I prefer

  Background:
    Given a customer is at checkout with items in their order

  @US1_choose_fulfillment
  Scenario: Choose between shipping and pickup
    Given a customer is at checkout
    When they view the fulfillment section
    Then they can choose between "Shipping" and "Pickup"

  @US1_choose_fulfillment
  Scenario: Shipping shows a shipping-address form
    Given the customer selects "Shipping"
    When they proceed
    Then a shipping-address form appears for them to enter the delivery address

  @US1_choose_fulfillment
  Scenario: Pickup requires no shipping address
    Given the customer selects "Pickup"
    When they proceed
    Then no shipping-address form is shown and pickup is recorded as the fulfillment method

  @US1_choose_fulfillment
  Scenario: Switch fulfillment method before completing the order
    Given a customer has chosen a fulfillment method
    When they switch to the other method before completing the order
    Then the form updates accordingly without losing the rest of their checkout details

  @US2_shipping_address
  Scenario: Capture a shipping address
    Given a customer selects shipping
    When they enter a shipping address
    Then the recipient name, street address, city, state, and postal code are collected

  @US2_shipping_address
  Scenario: Validate the shipping address
    Given a shipping address is entered
    When a required field is left blank or invalid
    Then the customer is prompted to correct it before completing the order

  @US2_shipping_address
  Scenario: Store the shipping address with the order
    Given a valid shipping address
    When the order completes
    Then the shipping address is stored with the order

  @US3_confirmation_and_email
  Scenario: Confirmation reflects shipping fulfillment
    Given an order was fulfilled by shipping
    When the confirmation page and email are shown
    Then they display the shipping address

  @US3_confirmation_and_email
  Scenario: Confirmation reflects pickup fulfillment
    Given an order was fulfilled by pickup
    When the confirmation page and email are shown
    Then they display that the order is for pickup

  @US3_confirmation_and_email
  Scenario: Confirmation indicates the fulfillment method
    Given any completed order
    When the customer views confirmation
    Then the fulfillment method is clearly indicated