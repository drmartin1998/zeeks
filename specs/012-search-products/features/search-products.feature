Feature: Product Search
  As a customer browsing the Zeeks store
  I want to search for products by keyword
  So that I can quickly find items I am looking for

  Background:
    Given the search bar is visible in the navigation

  @US1_search-products-by-keyword
  Scenario: Search returns matching products
    Given the search bar is visible on the page
    When a user types "warhammer" and submits the search
    Then they are taken to /search?q=warhammer
    And matching products from the Square catalog are displayed in a product grid

  @US1_search-products-by-keyword
  Scenario: Search returns empty state
    Given the search bar is visible
    When a user searches for a keyword matching no products
    Then a "No products found" message is displayed with the searched keyword

  @US1_search-products-by-keyword
  Scenario: Empty search query
    Given the search bar is visible
    When a user submits an empty search
    Then they stay on the current page
