Feature: Allowlisted Category Filtering (Miniatures + Hobby Supplies)
  As a customer browsing the Zeeks online store
  I want to see only the Miniatures and Hobby Supplies categories among Square-powered navigation links
  So that I am not distracted by categories that have no products or are not yet stocked

  Background:
    Given the Square catalog is available and contains multiple top-level categories

  @US1_allowlisted-navigation
  Scenario: Navigation bar shows only allowlisted categories from Square catalog
    Given the Square catalog contains top-level categories "Miniatures" (ID ZCZJWQX6WREDLATZFW3U7OCJ), "Hobby Supplies" (ID 62G7JSXJDS4U574NW4XS4WKV), and "Board Games"
    When any page loads with the navigation bar
    Then only "Miniatures" and "Hobby Supplies" appear as Square-powered nav categories
    And the static links "About Us", "Locations", and "Sale" are also displayed

  @US1_allowlisted-navigation
  Scenario: Navigation bar handles only allowlisted categories present
    Given the Square catalog contains only "Miniatures" and "Hobby Supplies" as top-level categories
    When any page loads
    Then the nav bar shows both categories alongside the static links with no degradation

  @US1_allowlisted-navigation
  Scenario: Navigation bar gracefully handles Square API errors
    Given both Miniatures and Hobby Supplies categories are temporarily unavailable or the Square API returns an error
    When any page loads
    Then only the static nav links "About Us", "Locations", and "Sale" are displayed
    And no error is shown to the user

  @US2_category-pages-allowlisted
  Scenario: Miniatures category page renders with products and subcategories
    Given the Miniatures category exists in Square
    When a user visits /categories/miniatures
    Then the Miniatures product listing page renders with its products and subcategories

  @US2_category-pages-allowlisted
  Scenario: Hobby Supplies category page renders with products and subcategories
    Given the Hobby Supplies category exists in Square
    When a user visits /categories/hobby-supplies
    Then the Hobby Supplies product listing page renders with its products and subcategories

  @US2_category-pages-allowlisted
  Scenario: Non-allowlisted category page returns 404
    Given a non-allowlisted top-level category "Board Games" exists in Square but is excluded by the filter
    When a user visits /categories/board-games
    Then a 404 page or "category not found" message is displayed

  @US2_category-pages-allowlisted
  Scenario: Allowlisted category subcategories appear as filter chips
    Given the Miniatures category has subcategories such as "Warhammer 40K"
    When a user visits /categories/miniatures
    Then subcategory filter chips are displayed for those subcategories

  @US3_api-allowlisted-only
  Scenario: Categories API returns only allowlisted categories as top-level
    Given the Square catalog contains multiple top-level categories
    When the categories API endpoint is called
    Then only the Miniatures category (ZCZJWQX6WREDLATZFW3U7OCJ) and Hobby Supplies category (62G7JSXJDS4U574NW4XS4WKV) are returned as top-level categories

  @US3_api-allowlisted-only
  Scenario: Categories API excludes subcategories
    Given the Miniatures and Hobby Supplies categories have subcategories
    When the categories API endpoint is called
    Then subcategories are excluded from the response
    And only top-level categories are returned
