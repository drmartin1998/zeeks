Feature: Clerk Sign-In from Profile Icon
  As a visitor to the Zeeks site
  I want to click the profile icon and sign in or sign up using Clerk
  So that I can have a personalized experience with my own account

  Background:
    Given the Zeeks site is loaded in the browser
    And the Clerk authentication provider is configured

  @US1_trigger-sign-in
  Scenario: Unauthenticated visitor clicks profile icon
    Given a visitor is not signed in and viewing any page on the Zeeks site
    When they click the profile icon in the navigation bar
    Then the Clerk sign-in and sign-up interface is displayed

  @US1_trigger-sign-in
  Scenario: Visitor completes sign-up flow from profile icon
    Given the Clerk sign-in modal is open
    When a visitor completes the sign-up flow with valid credentials
    Then they are returned to the page they were viewing
    And the profile icon reflects their authenticated state

  @US1_trigger-sign-in
  Scenario: Visitor completes sign-in flow from profile icon
    Given the Clerk sign-in modal is open
    When a visitor completes the sign-in flow with valid existing credentials
    Then they are returned to the page they were viewing
    And the profile icon reflects their authenticated state

  @US1_trigger-sign-in
  Scenario: Visitor dismisses sign-in modal without authenticating
    Given the Clerk sign-in modal is open
    When a visitor dismisses the modal without signing in
    Then they return to the page they were viewing
    And no authentication state change occurs

  @US2_authenticated-indicator
  Scenario: Signed-in user sees authenticated state in navigation bar
    Given a user is signed in
    When they view any page on the site
    Then the navigation bar displays their user avatar or a personalized user menu
    And the generic profile icon is no longer shown

  @US2_authenticated-indicator
  Scenario: Signed-in user signs out
    Given a user is signed in and their avatar or user menu is displayed
    When they choose to sign out
    Then their session ends
    And the navigation bar returns to showing the generic profile icon

  @US2_authenticated-indicator
  Scenario: Signed-in user reopens browser within session validity
    Given a user is signed in and closes their browser
    When they reopen the site in the same browser within the session validity period
    Then they remain signed in without needing to re-authenticate

  @US3_session-persistence
  Scenario: Authenticated state persists across page navigation
    Given a user is signed in
    When they navigate to a different page on the site
    Then their authenticated state persists
    And the user avatar or menu remains visible

  @US3_session-persistence
  Scenario: Authenticated state persists after hard page refresh
    Given a user is signed in
    When they perform a hard page refresh
    Then their authenticated state is preserved
    And they are not prompted to sign in again
