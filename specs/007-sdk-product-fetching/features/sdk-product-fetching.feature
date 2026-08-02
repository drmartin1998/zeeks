Feature: SDK-Only Product Fetching
  As a Zeeks customer
  I want to browse products that are always fetched from the live Square catalog
  So that I see accurate pricing, availability, and product details at all times

  Background:
    Given the Square SDK is configured with valid sandbox credentials
    And the Zeeks storefront is deployed

  # ============================================================================
  # User Story 1 — Browse Products via SDK-Backed Catalog
  # Priority: P1 — MVP
  # ============================================================================

  @US1 @sdk-backed-catalog @priority-p1
  Scenario: Homepage displays SDK-fetched products
    Given the storefront home page
    When a customer loads the page
    Then all displayed products are fetched via the Square SDK
    And match the live Square catalog for the configured location

  @US1 @sdk-backed-catalog @priority-p1
  Scenario: Category page displays SDK-fetched products
    Given a category page exists in the Square catalog
    When a customer navigates to that category page
    Then all products in that category are fetched via the Square SDK
    And only products actually in that category in Square are displayed

  @US1 @sdk-backed-catalog @priority-p1
  Scenario: Product detail page fetches from SDK
    Given a product exists in the Square catalog
    When a customer clicks on that specific product
    Then the product details (name, description, price, images, inventory status) are fetched from Square SDK
    And accurately reflect the current Square catalog data

  @US1 @sdk-backed-catalog @priority-p1
  Scenario: Search results come from SDK
    Given the customer has entered a search query
    When the search is executed
    Then search results are retrieved via the Square SDK search catalog endpoint
    And no mock or hardcoded products appear in results

  # ============================================================================
  # User Story 2 — Graceful Error Handling on SDK Failure
  # Priority: P2
  # ============================================================================

  @US2 @graceful-error-handling @priority-p2
  Scenario: Error state displayed when Square API is unreachable
    Given the Square API is unreachable
    When a customer loads any product page
    Then a clear error message is displayed indicating products are temporarily unavailable
    And no mock or fallback product data is shown

  @US2 @graceful-error-handling @priority-p2
  Scenario: Retry with backoff on rate limit
    Given the Square SDK returns a rate-limited response
    When the storefront attempts to fetch products
    Then the system retries with exponential backoff
    And shows an error state only after all retries are exhausted

  @US2 @graceful-error-handling @priority-p2
  Scenario: No products message on empty catalog
    Given the Square SDK returns an empty catalog with no products configured
    When a customer views the storefront
    Then an appropriate "no products available" message is displayed
    And fallback mock products are not substituted

  @US2 @graceful-error-handling @priority-p2
  Scenario: Partial results displayed with incomplete data indicator
    Given a partial SDK response where some products loaded and some failed
    When a customer browses a category
    Then the available products are displayed
    And an indication of incomplete data is shown

  # ============================================================================
  # User Story 3 — Consistent SDK Usage Across All Product Endpoints
  # Priority: P3
  # ============================================================================

  @US3 @consistent-sdk-usage @priority-p3
  Scenario: Build or lint fails on mock data imports in production
    Given the production codebase
    When any import of @/lib/data or similar mock data modules is present outside of test files
    Then the build or lint step fails

  @US3 @consistent-sdk-usage @priority-p3
  Scenario: CI blocks merge of non-SDK product fetching
    Given a new feature branch
    When a developer attempts to merge code that uses non-SDK product fetching in a production path
    Then CI checks block the merge

  # ============================================================================
  # Edge Cases
  # ============================================================================

  @edge-case @partial-results
  Scenario: Handle missing required fields in product data
    Given a product in the Square catalog has missing required fields (e.g., no price, no image)
    When the storefront processes that product
    Then the system handles missing data gracefully
    And shows appropriate placeholders or omits the product if it is not displayable

  @edge-case @large-catalogs
  Scenario: Handle very large catalogs with pagination
    Given the Square catalog contains thousands of products
    When the system fetches products by category
    Then cursor-based pagination works through the SDK
    And all products are eventually retrieved

  @edge-case @concurrent-requests
  Scenario: Server-side caching prevents duplicate SDK calls
    Given multiple concurrent requests hit the same catalog data
    When each request is processed
    Then server-side caching prevents unnecessary duplicate SDK calls
