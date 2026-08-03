Feature: Custom Login & Sign-Up Forms
  As a visitor to the Zeeks site
  I want to sign in or sign up using custom branded forms
  So that the authentication experience matches the rest of the site design

  Background:
    Given the Zeeks site is loaded in the browser
    And the Clerk authentication provider is configured

  @US1_profile-dropdown
  Scenario: Unauthenticated visitor clicks profile icon
    Given a visitor is not signed in and viewing any page
    When they click the profile icon in the navigation bar
    Then a dropdown menu appears with "Login" and "Sign Up" options

  @US1_profile-dropdown
  Scenario: Visitor clicks Login in dropdown
    Given the profile dropdown is open
    When the visitor clicks "Login"
    Then they navigate to "/sign-in"

  @US1_profile-dropdown
  Scenario: Visitor clicks Sign Up in dropdown
    Given the profile dropdown is open
    When the visitor clicks "Sign Up"
    Then they navigate to "/sign-up"

  @US1_profile-dropdown
  Scenario: Dropdown closes when clicking outside
    Given the profile dropdown is open
    When the visitor clicks anywhere outside the dropdown
    Then the dropdown closes

  @US1_profile-dropdown
  Scenario: Authenticated user sees UserButton not dropdown
    Given a user is signed in
    When they view the navigation bar
    Then the generic profile icon is not shown
    And the Clerk UserButton is displayed instead

  @US2_sign-in-form
  Scenario: Successful sign-in with valid credentials
    Given a visitor is on the "/sign-in" page
    When they enter a valid email "user@example.com" and correct password
    And they submit the form
    Then they are authenticated via Clerk
    And they are redirected to the previous page they were viewing

  @US2_sign-in-form
  Scenario: Sign-in with invalid credentials shows error
    Given a visitor is on the "/sign-in" page
    When they enter an email "user@example.com" and an incorrect password
    And they submit the form
    Then an error message is displayed indicating invalid credentials
    And the user remains on the sign-in page

  @US2_sign-in-form
  Scenario: Sign-in with empty fields shows validation errors
    Given a visitor is on the "/sign-in" page
    When they submit the form with an empty email field
    Then an inline error "Email is required" is shown below the email field
    When they submit the form with an empty password field
    Then an inline error "Password is required" is shown below the password field

  @US2_sign-in-form
  Scenario: Authenticated user redirected from sign-in page
    Given a user is already signed in
    When they navigate to "/sign-in"
    Then they are redirected to the home page "/"

  @US3_sign-up-form
  Scenario: Successful sign-up with all valid fields
    Given a visitor is on the "/sign-up" page
    When they fill in first name "Jane", last name "Doe", email "jane@example.com", phone "+15551234567", password "securePass1!", and verify password "securePass1!"
    And they submit the form
    Then a Clerk account is created
    And the user is authenticated
    And they are redirected to the previous page

  @US3_sign-up-form
  Scenario: Mismatched passwords show validation error
    Given a visitor is on the "/sign-up" page
    When they enter "securePass1!" in the password field and "differentPass!" in verify password
    And they submit the form
    Then an inline error "Passwords do not match" is shown on the verify password field
    And no API call is made

  @US3_sign-up-form
  Scenario: Duplicate email shows API error banner
    Given a visitor is on the "/sign-up" page
    When they submit the form with an email that is already registered
    Then a Clerk API error banner is shown indicating the email is already in use
    And the form fields are preserved

  @US3_sign-up-form
  Scenario: Invalid phone format shows validation error
    Given a visitor is on the "/sign-up" page
    When they enter "555-1234" as the phone number (not E.164 format)
    And they submit the form
    Then an inline error is shown on the phone field indicating the required format

  @US3_sign-up-form
  Scenario: Empty required fields show validation errors
    Given a visitor is on the "/sign-up" page
    When they submit the form with all fields empty
    Then inline validation errors are shown for each required field

  @US3_sign-up-form
  Scenario: Authenticated user redirected from sign-up page
    Given a user is already signed in
    When they navigate to "/sign-up"
    Then they are redirected to the home page "/"

  @edge_navigation-links
  Scenario: Cross-form navigation links
    Given a visitor is on the "/sign-in" page
    When they click "Don't have an account? Sign up"
    Then they navigate to "/sign-up"
    Given a visitor is on the "/sign-up" page
    When they click "Already have an account? Sign in"
    Then they navigate to "/sign-in"
