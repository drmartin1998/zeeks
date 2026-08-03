Feature: Automatic Loyalty Program Enrollment
  As a customer signing up for an online account
  I want to be automatically enrolled in the store's loyalty program
  So that I can start earning points from my very first purchase

  Background:
    Given the Clerk webhook endpoint is configured and receiving user.created events
    And the Square API credentials are valid and configured
    And the Clerk-to-Square customer sync from spec 008 is operational

  @US1_auto-enrollment
  Scenario: New user with phone number is enrolled in loyalty
    Given a new user registers through Clerk with email "new@example.com" and primary phone "+15551234567"
    And no Square customer exists with that email
    And the Square loyalty program is configured with SQUARE_LOYALTY_PROGRAM_ID
    And no loyalty account exists for the Square customer
    When the Clerk "user.created" webhook is delivered and verified
    And a Square customer is created with ID "SQ_NEW"
    Then a loyalty account is created linked to Square customer "SQ_NEW" with program SQUARE_LOYALTY_PROGRAM_ID
    And the loyalty account has a phone mapping of "+15551234567"
    And the webhook returns 200

  @US1_auto-enrollment
  Scenario: New user without phone number skips enrollment gracefully
    Given a new user registers through Clerk with email "nophone@example.com" and no phone numbers
    And no Square customer exists with that email
    And the Square loyalty program is configured
    When the Clerk "user.created" webhook is delivered and verified
    And a Square customer is created with ID "SQ_NOPHONE"
    Then no loyalty account is created
    And a warning is logged indicating no phone number is available
    And the webhook returns 200

  @US1_auto-enrollment
  Scenario: Loyalty program not configured skips enrollment gracefully
    Given the SQUARE_LOYALTY_PROGRAM_ID environment variable is not set
    And a new user registers through Clerk with email "skip@example.com"
    And a Square customer is created with ID "SQ_SKIP"
    When the Clerk "user.created" webhook is delivered and verified
    Then no loyalty account is created
    And a warning is logged indicating the loyalty program is not configured
    And the webhook returns 200

  @US2_idempotency
  Scenario: Retried webhook does not create duplicate loyalty account
    Given a Clerk user already has a Square customer ID "SQ_EXIST" and a loyalty account linked to it
    When a duplicate "user.created" webhook is delivered for the same user
    Then the existing loyalty account is detected via search
    And no new loyalty account is created
    And the webhook returns 200

  @US2_idempotency
  Scenario: Retried webhook skips when Square customer already exists
    Given a Clerk user already has a Square customer ID "SQ_EXIST" from a prior sync
    When a duplicate "user.created" webhook is delivered for the same user
    Then the handler returns 200 immediately at the idempotency check
    And no Square API calls are made for customer search, customer create, or loyalty enrollment

  @US3_graceful-degradation
  Scenario: Loyalty search API failure does not block customer sync
    Given the Square Loyalty API is returning errors
    When a Clerk "user.created" webhook is processed for a new user with email "failsearch@example.com"
    And a Square customer is created with ID "SQ_FAIL"
    And the Square customer ID is saved to the Clerk user's profile
    Then the loyalty search error is logged with user context
    And the webhook returns 200

  @US3_graceful-degradation
  Scenario: Loyalty creation API failure does not block customer sync
    Given the Square Loyalty API search succeeds and finds no existing account
    But the loyalty account creation returns an error
    When a Clerk "user.created" webhook is processed for a new user
    And a Square customer is created and saved to Clerk
    Then the loyalty creation error is logged with user context
    And the webhook returns 200

  @US3_graceful-degradation
  Scenario: Loyalty program does not exist in Square returns error but webhook succeeds
    Given SQUARE_LOYALTY_PROGRAM_ID is set to a non-existent program ID
    And the loyalty account creation returns an error from Square
    When a Clerk "user.created" webhook is processed for a new user
    And a Square customer is created and saved to Clerk
    Then the error is logged
    And the webhook returns 200

  @edge_existing-customer
  Scenario: Returning user matched to existing Square customer is enrolled
    Given a user registers through Clerk with email "existing@example.com"
    And a Square customer already exists with email "existing@example.com" and ID "SQ_EXISTING"
    And no loyalty account exists for "SQ_EXISTING"
    When the Clerk "user.created" webhook is delivered and verified
    And the existing Square customer ID "SQ_EXISTING" is retrieved by email lookup
    Then a loyalty account is created linked to Square customer "SQ_EXISTING"
    And the webhook returns 200
