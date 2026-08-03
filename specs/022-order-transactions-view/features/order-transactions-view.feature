Feature: Paginated Order History
  As a logged-in customer
  I want to browse all my past orders with pagination
  So that I can review my complete purchase history beyond the initial 10

  Background:
    Given a customer is logged in with a valid Square customer ID

  @US1
  Scenario: View initial 10 orders when customer has more than 10
    Given a customer has 25 past orders in Square
    When they visit the account page
    Then the 10 most recent orders are displayed
    And a "Load More" button is visible below the list

  @US1
  Scenario: Load the next page of orders
    Given 10 orders are currently displayed and more orders remain
    When the customer clicks "Load More"
    Then the next 10 orders are appended to the existing list
    And the "Load More" button remains visible if more orders remain

  @US1
  Scenario: Load all orders until no more remain
    Given the customer has loaded all available orders
    When no more orders exist to fetch
    Then the "Load More" button is hidden
    And "Showing all N orders" is displayed

  @US1
  Scenario: Customer with no orders sees empty state
    Given a customer has zero orders in Square
    When they visit the account page
    Then "No orders yet — your order history will appear here" is displayed
    And no "Load More" button is shown

  @US1 @edge
  Scenario: Load More button is disabled during loading
    Given the customer clicks "Load More"
    When the next page is being fetched
    Then the button shows "Loading..." and is disabled
