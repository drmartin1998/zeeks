Feature: Clerk Auth Migration (createRouteMatcher)
  As a developer maintaining the Zeeks store
  I want to remove the deprecated Clerk createRouteMatcher usage
  So that the app is future-proofed against Clerk's next major release

  Background:
    Given the system is ready for the Clerk auth migration

  @US1_remove_deprecated_matcher
  Scenario: No createRouteMatcher deprecation warning on startup
    Given the application starts
    When the middleware loads
    Then no Clerk deprecation warning about createRouteMatcher is logged

  @US1_remove_deprecated_matcher
  Scenario: No createRouteMatcher usage remains in the codebase
    Given the codebase is searched for createRouteMatcher
    When the deprecated function is checked for
    Then no usage of the deprecated function remains

  @US2_preserve_site_password_gate
  Scenario: Protected page redirects to the password page without a password cookie
    Given a visitor has no password cookie
    When they request a protected page
    Then they are redirected to the password page with the original path preserved

  @US2_preserve_site_password_gate
  Scenario: Exempt route is served without a password cookie
    Given a visitor has no password cookie
    When they request an exempt route such as a webhook or Clerk asset
    Then the request is served without interruption

  @US2_preserve_site_password_gate
  Scenario: Protected page is served with the correct password cookie
    Given a visitor has the correct password cookie
    When they request a protected page
    Then the page is served normally

  @US3_keep_middleware_and_auth_checks
  Scenario: Protected resource rejects unauthenticated access
    Given a signed-out user
    When they access a protected page
    Then they are redirected to sign in via the resource's auth check

  @US3_keep_middleware_and_auth_checks
  Scenario: Protected resource renders for a signed-in user
    Given a signed-in user
    When they access a protected page
    Then the page renders normally