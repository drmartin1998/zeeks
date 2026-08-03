Feature: Edit Profile
  As a logged-in customer
  I want to edit my profile information
  So that my account details are accurate and up to date

  Background:
    Given a customer is logged in with a valid Square customer ID

  # === US1: Edit Personal Information (P1) ===

  @US1
  Scenario: Update first and last name successfully
    Given the edit profile page is loaded with pre-populated data from Square
    When the customer changes "First Name" to "Jane" and "Last Name" to "Doe"
    And clicks "Save Changes"
    Then the Square customer record is updated with givenName "Jane" and familyName "Doe"
    And the Clerk user profile is synced with the same values
    And a success confirmation message is displayed

  @US1
  Scenario: Update multiple personal fields (name, email, phone) simultaneously
    Given the edit profile page is loaded
    When the customer updates "First Name", "Last Name", "Email Address", and "Phone Number"
    And clicks "Save Changes"
    Then all four fields are updated in Square
    And all four fields are synced to Clerk
    And a success confirmation is displayed

  @US1 @edge
  Scenario: Square API update succeeds but Clerk sync fails after all retries
    Given the Square API is available
    And the Clerk API is returning errors
    When the customer updates their first name and clicks "Save Changes"
    Then the Square update succeeds
    And the Clerk sync is retried 3 times with exponential backoff
    And a non-blocking warning is displayed: "Profile saved but sync is delayed. Changes will sync automatically."

  @US1 @edge
  Scenario: Square API update fails after all retries
    Given the Square API is returning errors
    When the customer updates their profile and clicks "Save Changes"
    Then the Square update is retried 2 times with exponential backoff
    And an error message is displayed with a "Try Again" button
    And the form data is preserved for retry

  @US1 @edge
  Scenario: Clerk data is stale and gets silently synced to Square on page load
    Given the customer's Clerk profile has different name data than Square
    When the edit profile page loads
    Then the form is pre-populated from Square data
    And Clerk is silently synced to match Square in the background
    And no error is shown to the user

  # === US2: Edit Shipping Address (P2) ===

  @US2
  Scenario: Update shipping address successfully
    Given the edit profile page is loaded
    When the customer fills in "Street Address", "City", "State", and "Zip Code"
    And clicks "Save Changes"
    Then the Square customer address is updated
    And a success confirmation is displayed

  @US2 @edge
  Scenario: Address save fails after retries
    Given the Square API is returning errors for address updates
    When the customer updates their address and clicks "Save Changes"
    Then an error specific to the address section is displayed
    And a "Try Again" button is shown

  # === US3: Change Password (P3) ===

  @US3
  Scenario: Change password successfully
    Given the edit profile page is loaded
    When the customer enters their "Current Password", a valid "New Password", and confirms it
    And clicks "Save Changes"
    Then the password is updated in Clerk
    And a success confirmation is displayed

  @US3
  Scenario: Current password is incorrect
    Given the edit profile page is loaded
    When the customer enters an incorrect "Current Password"
    And clicks "Save Changes"
    Then an inline error "Current password is incorrect" is shown on the current password field
    And the form is not submitted

  @US3
  Scenario: New passwords do not match
    Given the edit profile page is loaded
    When the customer enters a correct "Current Password"
    And enters a "New Password" and a different "Confirm New Password"
    And clicks "Save Changes"
    Then an inline error "Passwords do not match" is shown on the confirm password field
    And the form is not submitted

  @US3
  Scenario: New password is too short
    Given the edit profile page is loaded
    When the customer enters a "New Password" with fewer than 8 characters
    And clicks "Save Changes"
    Then an inline error "Password must be at least 8 characters" is shown on the new password field
    And the form is not submitted

  # === Edge Cases ===

  @edge
  Scenario: Square API unavailable on page load
    Given the Square API is unreachable
    When the customer navigates to the edit profile page
    Then a full-page error is displayed with a retry button
    And the edit form is not shown

  @edge
  Scenario: Save button is disabled when no fields are modified
    Given the edit profile page is loaded with pre-populated data
    When the customer has not modified any fields
    Then the "Save Changes" button is disabled

  @edge
  Scenario: Save button is enabled when at least one field is modified
    Given the edit profile page is loaded
    When the customer changes any single field
    Then the "Save Changes" button is enabled

  @edge
  Scenario: Cancel returns to account page
    Given the customer is on the edit profile page
    When the customer clicks "Cancel"
    Then they are navigated to the account dashboard at "/account"

  @edge
  Scenario: Empty password fields skip password change
    Given the edit profile page is loaded
    When the customer updates their name but leaves all password fields empty
    And clicks "Save Changes"
    Then the name update proceeds normally
    And the password change operation is skipped entirely

  @edge
  Scenario: Email already taken in Clerk when syncing
    Given the Square API update succeeds with a new email
    And the Clerk API rejects the email sync because the email is already taken
    When the customer submits the updated email
    Then the Square update goes through
    And the Clerk sync error is displayed: "This email address is already in use by another account."
