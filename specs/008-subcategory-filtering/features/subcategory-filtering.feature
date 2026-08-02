Feature: Subcategory Filtering on Category Pages
  As a shopper browsing the Zeeks online store
  I want to view all products in a category and its subcategories
  with the ability to filter by subcategory
  So that I can efficiently browse products without navigating subcategory-by-subcategory

  Background:
    Given the product catalog is available
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
    And the "Strategy" chip becomes selected and highlighted
    And only products belonging to the "Strategy" subcategory are shown in the grid

  @US2 @P2
  Scenario: Reset filter to show all products
    Given the user is viewing "/categories/board-games" with the "Strategy" chip active
    When the user clicks the "All" chip
    Then the "Strategy" chip becomes deselected
    And the "All" chip becomes selected
    And all products from all subcategories and the parent are shown again

  @US2 @P2
  Scenario: No filter chips when category has no subcategories
    Given the catalog has a top-level category "Miniatures" with no subcategories
    When the user navigates to "/categories/miniatures"
    Then no subcategory filter chips are displayed above the product grid

  @US2 @P2
  Scenario: Product in multiple subcategories appears under all matching filters
    Given the catalog has a product tagged with both "Strategy" and "Family" subcategories
    When the user clicks the "Strategy" chip
    Then that product is visible in the grid
    When the user clicks the "Family" chip
    Then that product is also visible in the grid

  @US2 @P2
  Scenario: Filter with zero results shows contextual empty state
    Given the user is viewing "/categories/board-games"
    And a subcategory "Strategy" exists with zero tagged products
    When the user clicks the "Strategy" chip
    Then a message "No products in this subcategory" is displayed
    And a "Show all" button is visible that clears the filter

  @US3 @P3
  Scenario: Filter state persists in URL for shareability
    Given the user is viewing "/categories/board-games"
    When the user clicks the "Strategy" chip
    Then the URL updates to contain "?sub=strategy"
    And refreshing the page preserves the "Strategy" filter active

  @US3 @P3
  Scenario: Direct URL with subcategory parameter restores filter state
    Given a URL "/categories/board-games?sub=strategy" is opened directly
    When the page loads
    Then the "Strategy" filter chip is pre-selected
    And only products belonging to the "Strategy" subcategory are displayed

  @US3 @P3
  Scenario: Browser back button restores previous filter state
    Given the user has filtered to "Strategy" then "Family" via chips
    When the user presses the browser back button
    Then the "Strategy" filter is restored
    And the URL reflects the "Strategy" filter state

  @edge
  Scenario: Invalid subcategory parameter falls back to All
    Given a URL "/categories/board-games?sub=nonexistent" is opened
    When the page loads
    Then the "All" filter chip is selected
    And all products from all subcategories and the parent are displayed

  @edge
  Scenario: Large product count triggers pagination
    Given the catalog has 25 products tagged with the "Strategy" subcategory
    When the user filters by the "Strategy" chip
    Then only 12 products are displayed on the first page
    And pagination controls are visible below the grid

  @edge
  Scenario: Category page returns 404 for unrecognized category
    Given the catalog has no category matching "nonexistent-category"
    When the user navigates to "/categories/nonexistent-category"
    Then the server returns a 404 status

  @edge
  Scenario: Category page shows error when catalog is unreachable
    Given the product catalog is unreachable
    When the user navigates to "/categories/board-games"
    Then an error message is displayed
    And no mock or hardcoded products are shown
