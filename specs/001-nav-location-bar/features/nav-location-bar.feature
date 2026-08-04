Feature: Navigation Location Bar
  As a customer browsing the Zeeks website
  I want to see the store's city and today's operating hours in the navigation bar
  So that I can quickly know where the store is and whether it is currently open without visiting a separate page

  Background:
    Given the store has a single physical location configured in Square
    And the navigation bar is rendered on every page

  @US1_see-store-city
  Scenario: City is displayed in the navigation bar on page load
    Given a customer loads any page on the site
    When the navigation bar renders
    Then the store's city name is displayed in the navigation bar

  @US1_see-store-city
  Scenario: City text is human-readable
    Given a customer views the navigation bar
    When they read the location text
    Then the text clearly identifies the store's city in a human-readable format such as "Seattle, WA"

  @US2_see-todays-hours
  Scenario: Today's operating hours are displayed
    Given the store has defined hours for today
    When the navigation bar renders on any page
    Then today's operating hours are displayed
    And the format is similar to "Open today: 9 AM – 9 PM"

  @US2_see-todays-hours
  Scenario: Open Now status when within operating hours
    Given the current time is within today's operating hours
    And the current time is more than 30 minutes before closing
    When the hours are displayed
    Then an indicator shows the store is "Open Now"

  @US2_see-todays-hours
  Scenario: Closed Now status when outside operating hours
    Given the current time is outside today's operating hours
    When the hours are displayed
    Then an indicator shows the store is "Closed Now"

  @US2_see-todays-hours
  Scenario: Closing Soon status within 30 minutes of closing
    Given the current time is within 30 minutes of today's closing time
    When the hours are displayed
    Then an indicator shows the store is "Closing Soon"

  @US3_consistent-display
  Scenario: Location bar is visible across all pages
    Given a customer navigates between different pages on the site
    When they look at the navigation bar on each page
    Then the location and hours information remains visible and consistent

  @edge_no-hours-today
  Scenario: No hours defined for today
    Given today's hours are not defined for the store
    When the navigation bar renders
    Then the status shows "Closed Today" or the hours portion is hidden

  @edge_midnight-span
  Scenario: Operating hours span midnight
    Given the store's hours for today span midnight such as "8 PM – 2 AM"
    And the current time is between the opening time and midnight
    When the navigation bar renders
    Then the status correctly shows "Open Now"
    And the closing time is displayed accurately

  @edge_api-failure
  Scenario: Location data fails to load
    Given the Square Locations API returns an error
    When the navigation bar renders
    Then the location bar is hidden entirely
    And all navigation links render normally
