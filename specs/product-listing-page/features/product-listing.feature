Feature: Product Listing Page
  As a Zeeks customer
  I want to browse products by category with filtering and pagination
  So that I can discover and shop for games

  Background:
    Given the Zeeks product catalog is available
    And the user navigates to "/shop/board-games"

  @US1
  Scenario: Standard layout (1440px+ viewport)
    When the viewport width is 1440 pixels or wider
    Then the page displays the category hero with breadcrumbs "Home > Shop > Board Games"
    And the category hero shows the category name as a headline
    And the category hero shows the category description as a subtitle
    And the filter bar shows "Filters:" label with Category, Price Range, Player Count, and Age Range filter pills
    And the filter bar shows "Showing N of N results" text
    And the filter bar shows a "Sort by: Featured" dropdown
    And the product grid displays 4 products per row
    And each product card shows an image, category badge, title link, price, and Add to Cart button
    And the pagination bar shows page numbers with previous and next buttons
    And the active page is highlighted in purple

  @US2
  Scenario: Large layout (1024px viewport)
    When the viewport width is between 1024 and 1439 pixels
    Then the category hero content is visible but at reduced scale
    And the filter bar remains visible with all filter pills
    And the product grid displays 3 products per row
    And the pagination bar remains functional and centered

  @US3
  Scenario: Medium layout (768px viewport)
    When the viewport width is between 768 and 1023 pixels
    Then the category hero headline and subtitle fit within the viewport
    And the filter bar filters may wrap or stack
    And the product grid displays 2 products per row
    And the pagination bar remains functional with fewer visible page numbers

  @US4
  Scenario: Small layout (below 768px viewport)
    When the viewport width is below 768 pixels
    Then the category hero breadcrumbs and text remain readable
    And the filter bar stacks vertically
    And the product grid displays 1 product per row, centered
    And product cards fill the viewport width
    And the pagination bar shows only previous, next, and a few page numbers
