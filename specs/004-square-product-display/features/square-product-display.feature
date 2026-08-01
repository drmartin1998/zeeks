Feature: Square Product Display
  As a customer browsing the Zeeks online store
  I want to see product cards with titles, prices, and images from Square
  So that I can browse and shop the catalog

  Background:
    Given the Square Catalog API is available
    And the catalog has items assigned to categories

  @US1 @P1
  Scenario: Products display on category page
    Given the user is on the homepage
    When the user navigates to "/categories/board-games"
    Then product cards are rendered showing titles from Square
    And product cards show prices in dollar format
    And no hardcoded mock product data is present

  @US1 @P1
  Scenario: Category with zero products shows empty state
    Given a category exists in Square but has zero items
    When the user visits that category page
    Then an empty state message is shown: "No products found in this category yet"

  @US1 @P1
  Scenario: Category page returns 404 when Square API unreachable
    Given the Square Catalog API is unreachable
    When the user navigates to "/categories/board-games"
    Then the server returns a 404 status

  @US2 @P2
  Scenario: Featured products on homepage
    Given the Square API is available
    When the homepage loads
    Then the "New Arrivals" section displays product cards from Square
    And each card shows title, price, and image or gradient placeholder

  @US2 @P2
  Scenario: Homepage hides products when Square API unreachable
    Given the Square Catalog API is unreachable
    When the homepage loads
    Then the "New Arrivals" section is not displayed

  @US3 @P3
  Scenario: Product card shows accurate price
    Given a Square item priced at 3999 cents
    When displayed on the site
    Then the card shows price "$39.99"

  @US3 @P3
  Scenario: Product card shows subcategory label
    Given a Square item belongs to subcategory "Strategy" under parent "Board Games"
    When displayed on the site
    Then the card shows category label "Board Games — Strategy"

  @US3 @P3
  Scenario: Product card without image shows gradient placeholder
    Given a Square item has no image
    When displayed on the site
    Then the card shows a gradient background instead of an image
