Feature: Custom User Menu (Authenticated)
  As a signed-in customer
  I want a custom account dropdown that matches the site design
  So that I can see my name, access my account, and log out from a branded menu

  Background:
    Given the Zeeks site is loaded in the browser
    And the Clerk authentication provider is configured
    And the user is signed in

  @US1_custom-dropdown
  Scenario: Signed-in user sees custom dropdown instead of Clerk UserButton
    Given a user "Jane Doe" is signed in
    When they view the navigation bar
    Then a profile icon is displayed (not Clerk's UserButton)
    And clicking the icon opens a dropdown showing the name "Jane Doe"

  @US1_custom-dropdown
  Scenario: User clicks My Account link
    Given the authenticated dropdown is open
    When the user clicks "My Account"
    Then they navigate to "/account"

  @US1_custom-dropdown
  Scenario: User clicks Logout
    Given the authenticated dropdown is open
    When the user clicks "Logout"
    Then the user is signed out via Clerk
    And the nav bar shows the unauthenticated profile icon dropdown

  @US1_custom-dropdown
  Scenario: User with no name sees email as fallback
    Given a signed-in user has email "jane@example.com" but no first or last name
    When they open the authenticated dropdown
    Then the dropdown shows "jane@example.com" instead of a name

  @edge_dropdown-close
  Scenario: Dropdown closes on outside click
    Given the authenticated dropdown is open
    When the user clicks outside the dropdown
    Then the dropdown closes

  @edge_dropdown-close
  Scenario: Dropdown closes on Escape key
    Given the authenticated dropdown is open
    When the user presses the Escape key
    Then the dropdown closes
