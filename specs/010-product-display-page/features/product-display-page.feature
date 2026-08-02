Feature: Product Display Page
  As a customer browsing the Zeeks store
  I want to click on any product name and see a dedicated product display page with full details
  So that I can learn about products, view images, check prices, and make informed purchasing decisions

  Background:
    Given the Square catalog contains products with titles, descriptions, prices, and images
    And product links across the site use consistent URL slugs derived from product titles

  @US1_navigate-to-product-detail
  Scenario: Navigate to product detail from a category page
    Given a product exists in the Square catalog and has a valid slug
    When a user clicks that product's name on a category page
    Then the browser navigates to /products/[slug]
    And the page displays the product's title, price, description, and primary image

  @US1_navigate-to-product-detail
  Scenario: Navigate to product detail from search results
    Given a product exists in the Square catalog
    When a user clicks that product from the search results page
    Then the browser navigates to /products/[slug] with the same product detail display

  @US1_navigate-to-product-detail
  Scenario: Handle non-existent product slug
    Given a product slug does not exist in the Square catalog
    When a user navigates to /products/non-existent-product
    Then a 404 page is displayed with a clear "Product not found" message

  @US1_navigate-to-product-detail
  Scenario: Page layout matches Figma design
    Given the product display page loads successfully
    When the user views the page
    Then the layout includes breadcrumb navigation, product image, title, price, description, quantity selector, and add-to-cart button

  @US2_rich-product-information
  Scenario: Display multiple product images in a gallery
    Given a product in Square has multiple images
    When a user views that product's detail page
    Then all images are displayed in an image gallery
    And the first image is shown as the default

  @US2_rich-product-information
  Scenario: Display full product description with formatting
    Given a product in Square has a long description with formatting
    When a user views that product's detail page
    Then the description is displayed in full with preserved line breaks and paragraphs

  @US2_rich-product-information
  Scenario: Select product variations
    Given a product in Square has variations such as sizes or colors
    When a user views that product's detail page
    Then available variations are displayed
    And selecting a variation updates the displayed price and image if applicable

  @US2_rich-product-information
  Scenario: Display out of stock indicator
    Given a product in Square is out of stock
    When a user views that product's detail page
    Then the page displays an "Out of Stock" indicator
    And the add-to-cart button is disabled

  @US3_breadcrumb-and-related-products
  Scenario: Breadcrumb shows top-level category hierarchy
    Given a product belongs to a top-level category
    When a user views the product detail page
    Then a breadcrumb trail displays "Home > [Category] > [Product Name]"
    And each breadcrumb link is clickable

  @US3_breadcrumb-and-related-products
  Scenario: Breadcrumb shows subcategory hierarchy
    Given a product belongs to a subcategory under a top-level category
    When a user views the product detail page
    Then the breadcrumb displays "Home > [Category] > [Subcategory] > [Product Name]"
    And all parent segments are clickable

  @US3_breadcrumb-and-related-products
  Scenario: Display related products from the same category
    Given a product detail page is loaded
    When the page renders
    Then a "Related Products" section displays up to 4 other products from the same category
    And the currently viewed product is excluded from related products
