Feature: VIP Program Page
  As a shopper
  I want to discover, view, and purchase the VIP membership tiers
  So that I can join the VIP Program and unlock its benefits

  Background:
    Given the application is in a ready state
    And the store has "VIP Basic" and "VIP Premium" subscription plans configured in Square

  # ============================================================================
  # User Story 1 — Discover and reach the VIP Program page
  # Priority: P1 — MVP
  # ============================================================================

  @US1 @vip-program-nav @priority-p1
  Scenario: A "VIP Program" link appears in the global navigation
    Given a shopper is on any page of the site
    When they view the global navigation
    Then a "VIP Program" link is present

  @US1 @vip-program-nav @priority-p1
  Scenario: Clicking the "VIP Program" link navigates to the VIP Program page
    Given a shopper sees the "VIP Program" link in the global navigation
    When they click it
    Then they are taken to the VIP Program page

  # ============================================================================
  # User Story 2 — View the two VIP subscription tiers
  # Priority: P1 — MVP
  # ============================================================================

  @US2 @vip-tier-listing @priority-p1
  Scenario: The VIP Program page lists both subscription tiers
    Given the store has two Square subscription plans named "VIP Basic" and "VIP Premium"
    When a shopper loads the VIP Program page
    Then both tiers are displayed

  @US2 @vip-tier-listing @priority-p1
  Scenario: Each tier shows its name, price, and benefits
    Given a shopper views the VIP Program page
    When they look at the tier comparison
    Then each tier shows its name, price, and list of benefits

  @US2 @vip-tier-listing @priority-p1
  Scenario: A missing tier is not fabricated or replaced with placeholder data
    Given one of the two subscription plans is missing from the Square catalog
    When the page loads
    Then the page still shows the available tier(s) without breaking
    And the missing tier is not fabricated or replaced with placeholder data

  # ============================================================================
  # User Story 3 — Purchase a VIP subscription
  # Priority: P1 — MVP
  # ============================================================================

  @US3 @vip-purchase @priority-p1
  Scenario: A shopper can initiate a purchase for a VIP tier
    Given a shopper is viewing a VIP tier
    When they activate the purchase action for that tier
    Then they are taken through a checkout flow to purchase the subscription

  @US3 @vip-purchase @priority-p1
  Scenario: Completing the purchase creates a subscription in Square
    Given a shopper completes the subscription purchase
    Then a subscription is created against the selected plan in Square for the purchasing customer

  # ============================================================================
  # User Story 4 — Read program information on the VIP page
  # Priority: P2
  # ============================================================================

  @US4 @vip-program-info @priority-p2
  Scenario: The VIP Program page presents the program information sections
    Given a shopper loads the VIP Program page
    When they scroll through it
    Then they see the hero, the tier comparison, the VIP Weekends section, and the FAQ

  # ============================================================================
  # Edge Cases
  # ============================================================================

  @edge-case @error-handling
  Scenario: The page degrades gracefully when no subscription plans are available
    Given the Square catalog has no subscription plans or the API is unavailable
    When the VIP Program page loads
    Then the page shows a clear error or empty state
    And it does not substitute hardcoded or mock subscription data

  @edge-case @error-handling
  Scenario: The purchase flow handles a shopper who is not signed in
    Given a shopper is not signed in
    When they attempt to purchase a VIP tier
    Then the purchase flow prompts sign-in as needed consistent with the existing checkout behavior