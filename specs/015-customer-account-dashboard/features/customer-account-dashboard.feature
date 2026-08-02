Feature: Customer Account Dashboard
  As a logged-in customer
  I want to view my account dashboard
  So that I can see my reward points, saved information, and order history

  Background:
    Given the Zeeks site is loaded and the user is authenticated via Clerk
    And the user has a squareCustomerId stored in their Clerk session private metadata
    And the Square API credentials are configured and valid

  @US1_view-loyalty-points
  Scenario: Customer with loyalty points sees their balance
    Given a logged-in customer with squareCustomerId "CUST123" has an active Square loyalty account with 500 points
    When they visit the account dashboard at "/account"
    Then the page displays a loyalty points card showing "500" as a large metric
    And the card includes a label "Reward Points"

  @US1_view-loyalty-points
  Scenario: Customer without loyalty accounts sees empty points state
    Given a logged-in customer with squareCustomerId "CUST456" has no loyalty accounts in Square
    When they visit the account dashboard at "/account"
    Then the points section shows "No points yet — start earning with your next purchase"

  @US1_view-loyalty-points
  Scenario: Loyalty API failure degrades independently
    Given the Square Loyalty API is returning errors
    When a logged-in customer visits the account dashboard at "/account"
    Then the points section shows "Points unavailable"
    And the profile and orders sections still render their data normally

  @US2_view-profile-info
  Scenario: Customer sees their saved profile information
    Given a logged-in customer with squareCustomerId "CUST123" has profile data with given name "Jane", family name "Doe", and email "jane@example.com"
    When they visit the account dashboard at "/account"
    Then the profile card displays "Jane Doe"
    And the profile card displays "jane@example.com"

  @US2_view-profile-info
  Scenario: Customer profile fetch fails degrades independently
    Given the Square Customers API is returning errors
    When a logged-in customer visits the account dashboard at "/account"
    Then the profile section shows "Unable to load profile information"
    And the points and orders sections still render their data normally

  @US2_view-profile-info
  Scenario: Customer with missing squareCustomerId sees syncing state
    Given a logged-in customer does NOT have a squareCustomerId in their Clerk session private metadata
    When they visit the account dashboard at "/account"
    Then the page displays a syncing indicator with the message "Setting up your account..."
    And no Square API calls are attempted

  @US3_view-order-history
  Scenario: Customer with past orders sees order history table
    Given a logged-in customer with squareCustomerId "CUST123" has 5 past orders in Square
    When they visit the account dashboard at "/account"
    Then the page displays a table with 5 rows of order data
    And each row shows order ID, closed date, total amount, and fulfillment state
    And the orders are sorted by most recent first

  @US3_view-order-history
  Scenario: Customer without past orders sees empty orders state
    Given a logged-in customer with squareCustomerId "CUST456" has no past orders in Square
    When they visit the account dashboard at "/account"
    Then the orders section shows "No orders yet — your order history will appear here"

  @US3_view-order-history
  Scenario: Orders API failure degrades independently
    Given the Square Orders API is returning errors
    When a logged-in customer visits the account dashboard at "/account"
    Then the orders section shows "Order history unavailable"
    And the points and profile sections still render their data normally

  @US3_view-order-history
  Scenario: Orders table limits to 10 most recent
    Given a logged-in customer with squareCustomerId "CUST123" has 25 past orders in Square
    When they visit the account dashboard at "/account"
    Then only the 10 most recent orders are displayed
    And a "View all orders" link is shown below the table

  @edge_unauthenticated
  Scenario: Unauthenticated visitor is redirected to sign-in
    Given a visitor is NOT signed in
    When they attempt to navigate to "/account"
    Then they are redirected to the Clerk sign-in page

  @edge_all_apis_fail
  Scenario: All three Square APIs fail simultaneously
    Given the Square API is completely unreachable
    When a logged-in customer visits the account dashboard at "/account"
    Then the page displays a full-page error state
    And a retry suggestion is shown to the user
