Feature: Clerk Webhook Integration
  As the system backend
  I want to securely receive webhook events from Clerk
  So that I know when a new user registers on the headless storefront

  Background:
    Given the CLERK_WEBHOOK_SECRET environment variable is configured
    And the Clerk Dashboard is sending webhooks to POST /api/webhooks/clerk

  @US1_secure-receipt
  Scenario: Valid webhook signature is accepted
    Given a Clerk webhook event is dispatched with valid svix-id, svix-timestamp, and svix-signature headers
    When the webhook endpoint receives the POST request
    Then the signature is verified successfully
    And the event type and data ID are logged to the console
    And a 200 response is returned with body {"success": true}

  @US1_secure-receipt
  Scenario: Invalid webhook signature is rejected
    Given a Clerk webhook event is dispatched with an invalid or tampered svix-signature header
    When the webhook endpoint receives the POST request
    Then the signature verification fails
    And a 400 response is returned with body {"error": "Invalid webhook signature"}

  @US1_secure-receipt
  Scenario: Missing Svix headers are rejected
    Given a request is sent without the required svix-id, svix-timestamp, or svix-signature headers
    When the webhook endpoint receives the POST request
    Then the signature verification fails
    And a 400 response is returned

  @US1_secure-receipt
  Scenario: Missing webhook secret returns server error
    Given the CLERK_WEBHOOK_SECRET environment variable is not configured
    When the webhook endpoint receives any POST request
    Then a 500 response is returned
    And the response body contains "Webhook secret not configured"

  @US2_observability
  Scenario: Console log includes event type and data ID for user.created events
    Given a valid user.created webhook event is received
    When the endpoint processes it
    Then the console log includes the string "Clerk webhook received — type: user.created, data.id: <user_id>"

  @US2_observability
  Scenario: Console log includes event type and data ID for any event type
    Given a valid webhook event of any type is received
    When the endpoint processes it
    Then the console log includes both the event type and the data object's ID field
