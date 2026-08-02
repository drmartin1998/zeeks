Feature: Channel-Based Category Filtering
  As a site administrator
  I want only categories assigned to the designated Square sales channel to appear on the website
  So that the storefront reflects the same product catalog visible through Square's online channel

  Background:
    Given the Square channel ID is configured as an environment variable
    And categories exist in the Square catalog with channel assignments

  @US1_channel-restricted-categories
  Scenario: Navigation bar only shows categories from the target channel
    Given the specified channel ID is configured
    When the navigation bar fetches categories
    Then only categories whose channels array includes the target channel ID are returned

  @US1_channel-restricted-categories
  Scenario: Category excluded when not in target channel
    Given a category exists in Square but is NOT assigned to the target channel
    When a user visits the website
    Then that category does not appear in the navigation bar, category listing pages, or any product grid

  @US1_channel-restricted-categories
  Scenario: Category included when in target channel
    Given a category exists in Square and is assigned to the target channel
    When a user visits any page on the website
    Then that category may appear in navigation and category listing pages subject to the existing allowlist filter

  @US2_subcategory-channel-inheritance
  Scenario: Subcategories appear when parent is in target channel
    Given a parent category is assigned to the target channel and has subcategories
    When the category listing page loads
    Then those subcategories appear in the Category dropdown filter

  @US2_subcategory-channel-inheritance
  Scenario: Subcategories excluded when parent is not in target channel
    Given a parent category is NOT assigned to the target channel
    When the subcategory resolution logic runs
    Then that parent's subcategories are never returned

  @US3_centralized-channel-config
  Scenario: All consumers receive channel-filtered data automatically
    Given the channel filter is implemented in the shared category fetch function
    When any existing or new consumer calls that function
    Then only channel-filtered categories are returned

  @US3_centralized-channel-config
  Scenario: New channel-eligible categories appear automatically
    Given the channel filter is applied centrally
    And the Square catalog adds a new category assigned to the target channel
    When the website loads the navigation or category page
    Then the new category automatically appears on the website without code changes
