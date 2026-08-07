Feature: Faceted Product Listing Filters
  As a shopper browsing a category
  I want to filter products by subcategory, brand, and availability
  So that I can quickly narrow down to the products I want

  Background:
    Given the system is ready for faceted product listing

  @US1_filter_by_subcategory
  Scenario: Apply a subcategory filter
    Given a shopper is on a category listing page
    When they apply a subcategory filter
    Then the product list shows only products belonging to that subcategory

  @US1_filter_by_subcategory
  Scenario: Clear a subcategory filter
    Given a shopper has a subcategory filter applied
    When they clear the filter
    Then the full product list for the category is restored

  @US1_filter_by_subcategory
  Scenario: Subcategory facet is pre-populated
    Given a shopper is on a category listing page
    When the page loads
    Then the subcategory facet is pre-populated with all subcategories below the currently selected top category

  @bug_nested_subcategory_without_direct_products
  Scenario: Nested subcategory with no direct products is displayed and its descendant products are reachable
    Given a top-level category has a subcategory
    And that subcategory has no products assigned directly to it
    And that subcategory has its own sub-subcategories that hold products
    When the shopper opens the category listing page
    Then the subcategory is still displayed as a subcategory facet option
    And products in its sub-subcategories are fetched and shown on the page
    When the shopper selects that subcategory filter
    Then the product list shows the products from its sub-subcategories

  @bug_drill_down_subcategory_reveal
  Scenario: Selecting a subcategory reveals its child subcategories in the facet
    Given a top-level category has a subcategory with its own child subcategories
    When the shopper opens the category listing page
    Then only the top-level subcategories are shown in the subcategory facet
    When the shopper selects a subcategory
    Then its child subcategories are revealed as a second (indented) level in the facet
    And the product list filters to all products under that subcategory (subcategory and its descendants)
    When the shopper selects one of the revealed child subcategories
    Then the product list filters to that child subcategory's products only

  @bug_drill_down_child_keeps_parent_expanded
  Scenario: Selecting a child subcategory keeps the parent's children revealed
    Given a top-level category has a subcategory with its own child subcategories
    And the shopper has selected the subcategory, revealing its child subcategories
    When the shopper selects one of the revealed child subcategories
    Then the parent subcategory's children remain visible (stay expanded) in the facet
    And the product list filters to that child subcategory's products only

  @US2_filter_by_brand
  Scenario: Apply a single brand filter
    Given products in a category carry a brand
    When a shopper selects a specific brand
    Then the product list shows only products with that brand

  @US2_filter_by_brand
  Scenario: Apply multiple brand filters
    Given a shopper has selected a brand
    When they select a second brand
    Then the product list includes products matching either selected brand

  @US2_filter_by_brand
  Scenario: Clear all brand filters
    Given a shopper has brand filters applied
    When they clear all brand filters
    Then all products in the category are shown again

  @US3_filter_by_availability
  Scenario: Filter to in-stock products
    Given a category contains both in-stock and out-of-stock products
    And a product is in stock when any of its variations is available
    When a shopper selects "In Stock"
    Then only in-stock products are shown

  @US3_filter_by_availability
  Scenario: Filter to out-of-stock products
    Given a shopper selects "Out of Stock"
    When the list updates
    Then only out-of-stock products are shown

  @US3_filter_by_availability
  Scenario: Clear an availability filter
    Given a shopper has an availability filter applied
    When they clear it
    Then all products in the category are shown again

  @US4_responsive_layout
  Scenario: Desktop large screen shows a left filter sidebar
    Given a shopper views the listing on a large screen
    When the page renders
    Then filters appear in a persistent left sidebar alongside the product grid
    And the sidebar is positioned to the LEFT of the product results

  @US4_responsive_layout
  Scenario: Medium screen shows a horizontal filter strip
    Given a shopper views the listing on a medium screen
    When the page renders
    Then filters appear as a horizontal strip above the product grid

  @US4_responsive_layout
  Scenario: Small screen shows a filter toggle and category chips
    Given a shopper views the listing on a small screen
    When the page renders
    Then a filter toggle with an active-filter count is shown and category filters appear as chips

  @bug_drill_down_subcategory_reveal @US4_responsive_layout
  Scenario: Medium and small screens reveal child subcategories on parent select
    Given a subcategory has its own child subcategories
    When the shopper views the listing on a medium screen using the horizontal filter strip
    Or when the shopper views the listing on a small screen and opens the filter toggle
    Then only the top-level subcategories are shown in the subcategory facet
    When the shopper selects a subcategory
    Then its child subcategories are revealed as a second (indented) level in the facet
    And the product list filters to all products under that subcategory (subcategory and its descendants)

  @US4_responsive_layout
  Scenario: The large-screen sidebar does not include a price range facet
    Given a shopper views the listing on a large screen
    When the page renders
    Then no Price Range facet is shown in the sidebar
    And the sidebar contains only the Categories, Brand, and Availability facets
  @bug_drill_down_on_both_listing_routes
  Scenario: Subcategory drill-down works on both the categories and shop listing routes
    Given a subcategory has its own child subcategories
    When the shopper browses either the /categories/[slug] or /shop/[category] listing page
    And the shopper selects the subcategory
    Then its child subcategories are revealed as a second level in the facet
    The categories-only route (/categories/[slug]) must pass the full subcategory tree so the drill-down works identically to /shop/[category]

  @bug_pdp_breadcrumb_top_level_link
  Scenario: The product detail breadcrumb links back to the top-level category listing
    Given a product belongs to a deeply nested category hierarchy (top-level → subcategory → sub-subcategory)
    When a shopper opens the product detail page
    Then the breadcrumb shows the full category path from the top-level category down to the product's category
    And the top-level category segment links to /categories/<top-level-slug>
    And that top-level link resolves to a valid listing page (does not 404)
    And each intermediate subcategory segment links to the top-level listing with a sub filter
    And the final breadcrumb segment is the product title (non-link)

  @bug_pdp_breadcrumb_multi_category_primary
  Scenario: A product assigned to multiple categories resolves its breadcrumb using a visible category even when categories[0] is excluded
    Given a product is assigned to multiple Square categories
    And the first assigned category is not part of the visible (channel-filtered) hierarchy
    But a later assigned category resolves up to an allowlisted top-level category
    When a shopper opens the product detail page
    Then the breadcrumb shows the full category path for the visible category instead of "Uncategorized"
    And the top-level breadcrumb segment is the allowlisted top-level category (e.g. "Miniatures")

  @bug_nested_subcategory_url_preselect
  Scenario: A nested subcategory in the URL is preselected and its parent revealed
    Given a top-level category listing page is loaded with a ?sub= URL parameter pointing to a nested subcategory
    When the subcategory is not a direct child of the top-level category but a descendant
    Then that nested subcategory is preselected (checked) in the subcategory facet
    And its ancestor subcategories are revealed so the selected descendant is visible
    And the product list filters to the products of that nested subcategory

  @bug_listing_images_resolved
  Scenario: Product listing shows the real product image from Square
    Given a category listing page loads products via getSquareProductsByCategorySlug
    And some items in the searchItems response carry itemData.imageIds (item-level)
    And some items only carry image IDs at the variation level
    And some items have no image at all
    When the listing resolves each item's image IDs via batchGet of the IMAGE catalog objects
    Then each item with an image is assigned its primary image URL
    And an item with only variation-level images falls back to that URL
    And an item with no images keeps its image empty so the gradient placeholder renders

  @bug_listing_images_proportional
  Scenario: Product card images stay proportional as the viewport changes
    Given a product listing renders GameCard components
    When the viewport or column width changes
    Then the card image area scales proportionally using an aspect-ratio container (not a fixed height)
    And the image fills that container without distorting
