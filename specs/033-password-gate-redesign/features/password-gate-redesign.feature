Feature: Password Gate Redesign
  As a visitor entering the Zeeks site
  I want to see the redesigned password gate and gain access
  So that the site gate feels on-brand and access is controlled

  Background:
    Given the system is ready for the password gate

  @US1_new_password_gate_design
  Scenario: Show the redesigned password gate page
    Given a visitor has no password cookie
    When they request a protected page
    Then they are shown the redesigned password gate page per the Figma layout

  @US1_new_password_gate_design
  Scenario: The gate page shows the brand layout
    Given the password gate page renders
    When the visitor views it
    Then it shows the Zeeks logo, the "SOMETHING EPIC IS COMING" headline, the password form with an "UNLOCK EARLY ACCESS" button, and a footer with launch info and social links

  @US1_new_password_gate_design
  Scenario: Correct password grants access and redirects
    Given the password gate page is displayed
    When the visitor enters the correct password and submits
    Then they are granted access and redirected to their original destination

  @US2_keep_password_validation
  Scenario: Incorrect password shows an error
    Given a visitor on the password gate page
    When they enter an incorrect password
    Then an error message is shown and access is not granted

  @US2_keep_password_validation
  Scenario: Correct password redirects to the original destination
    Given a visitor on the password gate page
    When they enter the correct password
    Then they are granted access and redirected to the original destination preserved in returnTo

  @US3_cookie_expiration_24_hours
  Scenario: The password cookie expires after 24 hours
    Given a visitor successfully enters the correct password
    When the cookie is set
    Then its expiration is 24 hours from the time of entry

  @US3_cookie_expiration_24_hours
  Scenario: Expired cookie requires re-entry
    Given the password cookie has expired after 24 hours
    When the visitor requests a protected page
    Then they are redirected to the password gate again