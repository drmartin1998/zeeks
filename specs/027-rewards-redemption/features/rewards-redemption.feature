Feature: Rewards Redemption on Cart Page
  As a logged-in customer
  I want to view my loyalty points and select a reward to apply to my order on the cart page
  So that I can save money on this purchase using my earned rewards

  Background:
    Given I am authenticated as a customer with a Square loyalty account and items in my cart

  @US1_view-rewards
  Scenario: View loyalty panel with points balance on cart
    Given I have a loyalty account with 4280 points and items in my cart
    When I view the cart page
    Then a "Squares Loyalty" panel appears below the cart items
    And my current point balance is displayed as a large metric
    And my membership tier label is shown

  @US1_view-rewards
  Scenario: View all reward tiers as selectable options
    Given I have a loyalty account and items in my cart
    When I view the cart page
    Then all reward tiers are listed with name, description, and point cost
    And they are displayed as selectable radio-style options

  @US1_view-rewards
  Scenario: No loyalty account hides the panel
    Given I am logged in but have no loyalty accounts and items in my cart
    When I view the cart page
    Then the loyalty panel is not rendered

  @US1_view-rewards
  Scenario: Unaffordable reward tiers are visually distinguished
    Given I have a loyalty account with 100 points
    And the loyalty program has a reward tier requiring 500 points
    When I view the cart page
    Then the 500-point reward tier is displayed but grayed out as unavailable

  @US1_view-rewards
  Scenario: Loyalty panel shows skeleton while loading
    Given I have a loyalty account and the loyalty API is slow
    When I view the cart page
    Then a skeleton placeholder matching the panel shape is shown immediately
    And content replaces the skeleton when data arrives

  @US1_view-rewards
  Scenario: Earned points notice in order summary
    Given I have a loyalty account and items in my cart
    When I view the cart page
    Then the order summary sidebar displays "You'll earn X points on this order"

  @US2_redeem-reward
  Scenario: Select a reward and see visual confirmation
    Given I have 4280 points and unselected rewards on the cart page
    When I click on a reward option costing 1000 points
    Then the reward is visually selected with a gold border and filled radio circle
    And a "Selected" badge appears on the reward row
    And the panel footer shows "3,280 points remaining after purchase"

  @US2_redeem-reward
  Scenario: Switch reward selection
    Given I have a reward selected on the cart page
    When I click a different reward option
    Then the previously selected reward deselects
    And the new reward selects
    And only one reward remains active

  @US2_redeem-reward
  Scenario: Deselect a reward by clicking it again
    Given I have a reward selected on the cart page
    When I click the selected reward option again
    Then the reward deselects and loses the gold border
    And the "Selected" badge disappears
    And the panel footer shows full points balance

  @US2_redeem-reward
  Scenario: Reward API error shows inline error
    Given I have selected a reward on the cart page
    When the Square API returns an error
    Then an inline error message is displayed in the loyalty panel
    And the reward selection reverts
    And no discount is applied

  @US2_redeem-reward
  Scenario: Prevent duplicate clicks during API call
    Given I am selecting a reward on the cart page
    When I click a reward option and the API call is in progress
    Then clicking other reward options has no effect
    And no duplicate rewards are created

  @US2_redeem-reward
  Scenario: Pre-selected reward shown on page load
    Given I already have an ISSUED loyalty reward on my current order
    When I view the cart page
    Then the reward is displayed as pre-selected with gold border

  @US3_responsive-display
  Scenario: Desktop layout at large breakpoint
    Given I am on a desktop device with a 1280px viewport
    When I view the cart page
    Then the loyalty panel spans the full width of the cart items column
    And reward options are displayed in a vertical list

  @US3_responsive-display
  Scenario: Tablet layout at medium breakpoint
    Given I am on a tablet device with a 768px viewport
    When I view the cart page
    Then the loyalty panel adapts to the narrower column
    And text remains readable and tap targets are accessible

  @US3_responsive-display
  Scenario: Mobile layout at small breakpoint
    Given I am on a phone with a 375px viewport
    When I view the cart page
    Then reward options stack vertically with full-width rows
    And touch targets are at least 44px tall

  @US3_responsive-display
  Scenario: Smooth transition between breakpoints
    Given I am viewing the cart page
    When I resize my browser between breakpoints
    Then the loyalty panel layout transitions smoothly without content overflow or overlap

  @US3_responsive-display
  Scenario: Skeleton placeholder is responsive
    Given I am on a mobile device and the loyalty data is loading
    When I view the cart page
    Then the skeleton placeholder matches the mobile panel layout
