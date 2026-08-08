Feature: Resend Order Emails
  As a customer
  I want to receive an email confirmation when I complete an order
  So that I have a record of my purchase and its order reference

  Background:
    Given a completed order with an associated customer email address

  @US1_order_confirmation_email
  Scenario: Send a confirmation email when an order is completed
    Given a customer places an order and payment succeeds
    When the order is marked complete
    Then an email is sent to the customer's email address containing the order confirmation details

  @US1_order_confirmation_email
  Scenario: Email includes full order details
    Given an order confirmation email is sent
    When the customer opens it
    Then the email includes the full order ID, a list of purchased items with quantities and prices, and the order subtotal

  @US1_order_confirmation_email
  Scenario: Email is addressed to the ordering customer
    Given a completed order
    When the email is sent
    Then the email is addressed to the customer who placed the order, not a generic address

  @US2_signed_in_customers
  Scenario: Send the confirmation email to the signed-in customer's account email
    Given a signed-in customer completes an order
    When the order is complete
    Then the confirmation email is sent to the email address on their account

  @US2_signed_in_customers
  Scenario: Signed-in order email matches the guest email content
    Given a signed-in order completion
    When the email is sent
    Then it contains the same order confirmation details as a guest order

  @US3_graceful_failure
  Scenario: Order completes when the email cannot be sent
    Given an order completes but the email service cannot be reached
    When the order is marked complete
    Then the order still completes successfully and the customer is not shown an error

  @US3_graceful_failure
  Scenario: Log an email-sending failure
    Given an email-sending failure
    When it occurs
    Then the failure is logged for review without interrupting the checkout