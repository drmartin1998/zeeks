Feature: Guest Loyalty Prompt on Checkout
  As an unauthenticated visitor
  I want to see a loyalty incentive notification on the checkout page
  So that I know I can earn points and redeem rewards by creating an account or signing in

  Background:
    Given the loyalty program is configured and available

  @US1_guest-sees-loyalty-prompt
  Scenario: Guest sees loyalty notification on checkout page load
    Given an unauthenticated visitor with a non-empty cart on the checkout page
    And the loyalty program is configured and the Square loyalty API is responsive
    When the checkout page loads
    Then a notification banner is displayed about earning loyalty points and redeeming rewards by registering or signing in
    And the notification includes "Register" and "Sign In" call-to-action buttons
    And the checkout payment flow remains fully functional
    And the notification is announced to screen readers as a live region with role "status"

  @US1_guest-sees-loyalty-prompt
  Scenario: Guest checkout is not blocked by loyalty notification
    Given an unauthenticated visitor viewing the loyalty notification on the checkout page
    When they complete checkout as a guest without interacting with the notification
    Then the checkout proceeds normally and payment is processed

  @US1_guest-sees-loyalty-prompt
  Scenario: Guest dismisses the loyalty notification
    Given an unauthenticated visitor viewing the loyalty notification on the checkout page
    When they dismiss or close the notification
    Then the notification is removed from the checkout page for the remainder of the browser session

  @US1_guest-sees-loyalty-prompt
  Scenario: Notification hidden when loyalty API is slow or unreachable
    Given an unauthenticated visitor with a non-empty cart on the checkout page
    And the Square loyalty API is unreachable or slow to respond
    When the checkout page loads
    Then the checkout page renders immediately without waiting for the loyalty API
    And the loyalty notification is not displayed

  @US1_guest-sees-loyalty-prompt
  Scenario: Notification hidden when loyalty program is not configured
    Given an unauthenticated visitor with a non-empty cart on the checkout page
    And the loyalty program is not configured
    When the checkout page loads
    Then the loyalty notification is not displayed
    And the checkout page functions normally

  @US1_guest-sees-loyalty-prompt
  Scenario: Dismissed notification does not reappear in same session
    Given a guest who previously dismissed the loyalty notification in the same browser session
    When they reach the checkout page again
    Then the loyalty notification does not reappear

  @US1_guest-sees-loyalty-prompt
  Scenario: Notification dismiss button is keyboard-operable
    Given an unauthenticated visitor viewing the loyalty notification on the checkout page
    When they focus the dismiss button via keyboard Tab and activate it with Enter or Space
    Then the notification is removed from the checkout page

  @US2_guest-clicks-register
  Scenario: Guest clicks Register from loyalty notification
    Given an unauthenticated visitor on the checkout page with the loyalty notification displayed
    When they click the "Register" button within the notification
    Then they are navigated to the registration page with a return_to parameter set to the checkout page
    And their guest cart state is preserved

  @US2_guest-clicks-register
  Scenario: Guest completes registration and returns to checkout authenticated
    Given a guest who clicked "Register" from the loyalty notification and completed registration
    When they return to the checkout page
    Then they are authenticated
    And their guest cart items are transferred to their account cart
    And the loyalty notification is replaced by the authenticated customer checkout experience

  @US2_guest-clicks-register
  Scenario: Guest abandons registration and returns to checkout
    Given a guest who clicked "Register" from the loyalty notification but abandoned the registration flow
    When they return to the checkout page
    Then they are still unauthenticated
    And their guest cart is preserved
    And the loyalty notification remains visible

  @US2_guest-clicks-register
  Scenario: return_to parameter default when missing after registration
    Given a guest who completed registration
    And no valid return_to parameter is present
    When they are redirected after registration
    Then they are redirected to the home page instead of crashing

  @US3_guest-clicks-sign-in
  Scenario: Guest clicks Sign In from loyalty notification
    Given an unauthenticated visitor on the checkout page with the loyalty notification displayed
    When they click the "Sign In" button within the notification
    Then they are navigated to the sign-in page with a return_to parameter set to the checkout page
    And their guest cart state is preserved

  @US3_guest-clicks-sign-in
  Scenario: Guest signs in and returns to checkout authenticated
    Given a guest who clicked "Sign In" from the loyalty notification and completed authentication
    When they return to the checkout page
    Then they are authenticated
    And their guest cart items are transferred to their account cart
    And the loyalty notification is replaced by the authenticated checkout experience

  @US3_guest-clicks-sign-in
  Scenario: Authenticated customer does not see loyalty notification
    Given a signed-in customer on the checkout page
    When the checkout page renders
    Then the guest loyalty notification is not displayed
    And the authenticated checkout experience shows instead

  @US3_guest-clicks-sign-in
  Scenario: return_to parameter default when missing after sign-in
    Given a guest who completed sign-in
    And no valid return_to parameter is present
    When they are redirected after sign-in
    Then they are redirected to the home page instead of crashing
