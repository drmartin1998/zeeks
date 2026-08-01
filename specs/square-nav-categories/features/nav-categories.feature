Feature: Square API Navigation Categories
  As a Zeeks customer
  I want the global navigation to display categories from the Square Catalog API
  So that the storefront always reflects the current product catalog

  Background:
    Given the Zeeks Square API is configured and accessible

  @US1
  Scenario: Navigation displays Square-managed categories
    When the user views any page with the global navigation
    Then the navigation category row displays categories fetched from the Square Catalog API
    And the static entries "About Us" and "Locations" appear after all Square categories
    And the "Sale" entry appears last with highlight styling

  @US2
  Scenario: Graceful fallback when Square API is unreachable
    Given the Square Catalog API is unreachable
    When the user views any page with the global navigation
    Then the navigation category row displays fallback categories
    And the fallback includes "Miniatures", "Board Games", "Card Games", and "Supplies"
    And the static entries "About Us", "Locations", and "Sale" appear at the end

  @US3
  Scenario: About Us and Locations are never pulled from Square
    When the navigation categories are fetched from the Square API
    Then "About Us" and "Locations" are excluded from the Square API response filter
    And "About Us" and "Locations" are always appended as static entries

  @US4
  Scenario: Categories API returns valid JSON
    When a client requests GET /api/catalog/categories
    Then the response status is 200
    And the response body is a JSON array of category objects
    And each category object has "label", "href", and optional "highlight" properties
    And the response includes Cache-Control headers for ISR caching
