Feature: Clerk-to-Square Customer Sync
  As a system backend
  I want to automatically sync Clerk user registrations to Square customers
  So that every registered user has a corresponding Square customer record for checkout, order history, and other commerce operations

  Background:
    Given the Clerk webhook endpoint is configured and receiving events
    And the Square API credentials are valid and configured
    And the webhook secret is properly set for signature verification

  @US1_automatic-square-customer-creation
  Scenario: New user registration creates a new Square customer
    Given a new user registers through Clerk with email "newuser@example.com", first name "John", and last name "Doe"
    And no Square customer exists with email "newuser@example.com"
    When the Clerk "user.created" webhook is delivered and verified
    Then a new Square customer is created with given name "John", family name "Doe", and email "newuser@example.com"
    And the Square customer ID is saved to the Clerk user's profile under the square customer identifier field

  @US1_automatic-square-customer-creation
  Scenario: Returning user links to existing Square customer
    Given a user registers through Clerk with email "existing@example.com"
    And a Square customer already exists with email "existing@example.com" and ID "SQ123"
    When the Clerk "user.created" webhook is delivered and verified
    Then the existing Square customer ID "SQ123" is retrieved by email lookup
    And the Square customer ID "SQ123" is saved to the Clerk user's profile
    And no duplicate Square customer is created

  @US1_automatic-square-customer-creation
  Scenario: Unverified webhook is rejected before any processing
    Given a Clerk "user.created" webhook is delivered
    And the webhook signature is invalid or tampered
    When the webhook is processed
    Then the system responds with a 400 status
    And no Square API calls are made
    And no Clerk profile updates are performed

  @US2_graceful-error-handling
  Scenario: Square API unreachable returns error without partial state
    Given the Square API is unreachable
    When a Clerk "user.created" webhook is processed for user "user123"
    Then the system logs the error with user context
    And the system returns a 500 status
    And the Clerk user profile is NOT updated

  @US2_graceful-error-handling
  Scenario: User without primary email returns validation error
    Given a Clerk "user.created" webhook payload contains a user with no email addresses
    When the webhook is processed
    Then the system logs a warning
    And the system returns a 400 status
    And no Square API calls are attempted

  @US2_graceful-error-handling
  Scenario: Square API rate-limited or timeout retries with backoff
    Given the Square API returns a rate-limited response HTTP 429 or the call times out
    When a Clerk "user.created" webhook is processed for user "user456"
    Then the system retries with exponential backoff up to 3 attempts with a 3-second timeout each
    And if all retries fail the system logs the error and returns a 500 status
    And the Clerk user profile is NOT updated


  @US2_graceful-error-handling
  Scenario: User without name still creates Square customer
    Given a Clerk "user.created" webhook payload contains a user with email "noname@example.com"
    And the user has no first name or last name
    And no Square customer exists with that email
    When the webhook is processed
    Then a new Square customer is created using the available email data only
    And the Square customer ID is saved to the Clerk user's profile

  @US3_idempotent-webhook-processing
  Scenario: Duplicate webhook skips when customer ID already exists
    Given a Clerk user already has a Square customer identifier saved in their profile
    When a duplicate "user.created" webhook is delivered for the same user
    Then the system returns 200 immediately
    And no Square API calls are made

  @US3_idempotent-webhook-processing
  Scenario: Second delivery with existing customer verifies and skips
    Given a Clerk user has a square customer identifier "SQ456" in their profile
    And the corresponding Square customer "SQ456" still exists
    When a "user.created" webhook is delivered again
    Then the system returns 200
    And no further action is taken
