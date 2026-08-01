Feature: Subcategory Browsing & Filtering
  As a customer browsing the Zeeks online store
  I want to see all products in a category and its subcategories
  with the ability to filter by subcategory
  So that I can efficiently browse products without navigating subcategory-by-subcategory

  Background:
    Given the Square Catalog API is available
    And the catalog has a top-level category "Board Games"
    And "Board Games" has subcategories "Strategy" and "Family"
    And each subcategory has assigned products

  @US1 @P1
  Scenario: View all products including subcategories
    Given the user is on the homepage
    When the user navigates to "/categories/board-games"
    Then the page heading displays "Board Games"
    And products from the "Board Games" parent category are visible
    And products from the "Strategy" subcategory are visible
    And products from the "Family" subcategory are visible
    And the total product count equals the sum of parent and all subcategory products

  @US1 @P1
  Scenario: View category with no subcategories
    Given the catalog has a top-level category "Miniatures" with no subcategories
    When the user navigates to "/categories/miniatures"
    Then the page heading displays "Miniatures"
    And only Miniatures products are displayed
    And no subcategory filter chips are shown

  @US1 @P1
  Scenario: View category with subcategories but no products
    Given the catalog has a top-level category "Supplies" with subcategories but no products
    When the user navigates to "/categories/supplies"
    Then the page heading displays "Supplies"
    And an empty state message is shown: "No products found in this category yet."

  @US2 @P2
  Scenario: Display subcategory filter chips
    Given the user is viewing "/categories/board-games"
    When the page loads
    Then filter chips labeled "All", "Strategy", and "Family" are displayed above the product grid
    And the "All" chip is selected by default

  @US2 @P2
  Scenario: Filter products by subcategory chip
    Given the user is viewing "/categories/board-games" with the "All" chip active
    When the user clicks the "Strategy" chip
    Then the "All" chip becomes deselected
    And the "Strategy" chip becomes selected (highlighted)
    And only products belonging to the "Strategy" subcategory are shown in the grid

  @US2 @P2
  Scenario: Reset filter to show all products
    Given the user is viewing "/categories/board-games" with the "Strategy" chip active
    When the user clicks the "All" chip
    Then the "Strategy" chip becomes deselected
    And the "All" chip becomes selected
    And all products from all subcategories and the parent are shown again

  @US3 @P3
  Scenario: Category page returns 404 when Square API is unreachable
    Given the Square Catalog API is unreachable
    When the user navigates to "/categories/board-games"
    Then the server returns a 404 status

  @US3 @P3
  Scenario: NavBar shows only static links when Square API is unreachable
    Given the Square Catalog API is unreachable
    When any page renders
    Then the navigation bar shows "About Us", "Locations", and "Sale" links
    And no Square-managed product category links are displayed

  @US3 @P3
  Scenario: Homepage hides dynamic sections when Square API is unreachable
    Given the Square Catalog API is unreachable
    When the homepage loads
    Then the "Popular Categories" section is not displayed
    And the "New Arrivals" section is not displayed
