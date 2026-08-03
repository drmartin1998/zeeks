Feature: Remove Account Settings Button
  As a logged-in customer
  I want to see only functional buttons on my profile card
  So that I am not confused by dead-end interactions

  Background:
    Given a customer is logged in

  @US1
  Scenario: Profile card shows only Edit Profile link
    Given the account dashboard is loaded
    When the profile card renders successfully
    Then only the "Edit Profile" link is visible
    And no "Account Settings" button is present

  @US1
  Scenario: Error state does not render Account Settings button
    Given the profile fetch fails
    When the profile card shows the error state
    Then no "Account Settings" button is rendered
