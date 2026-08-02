Feature: Gaming-Themed Error Page
  As a customer browsing the Zeeks store
  I want to see a branded, gaming-themed error page when something goes wrong
  So that I can understand what happened and easily return to browsing

  Background:
    Given the application has a shared gaming-themed error page component

  @US1_friendly-error-display
  Scenario: Error page displays battlefield illustration and gaming copy
    Given a runtime error or 404 occurs
    When the error page renders
    Then it displays the battlefield illustration
    And shows a "FAILED SAVING THROW" badge with "You Rolled a Natural 1"
    And shows "CRITICAL MISS!" heading in large purple Outfit font
    And shows the thematic subheading about the Warp

  @US1_friendly-error-display
  Scenario: Regroup at Homepage button navigates to home
    Given the error page is displayed
    When the user clicks "Regroup at Homepage"
    Then they navigate to the homepage

  @US1_friendly-error-display
  Scenario: Visit our homepage link navigates to home
    Given the error page is displayed
    When the user clicks "Visit our homepage"
    Then they navigate to the homepage

  @US1_friendly-error-display
  Scenario: Root error displays standalone page
    Given a root-level error occurs
    When the global error boundary triggers
    Then a standalone error page renders without nav bar or footer
