Feature: Shop Menu Drilldown
  As a store visitor
  I want to browse the product catalog through a "Shop" menu that reveals categories and their subcategories
  So that I can quickly find and navigate to any product category without searching

  Background:
    Given the global navigation is visible with a "Shop" menu item
    And the product catalog is available with a hierarchy of categories

  @US1_shop_desktop_megamenu
  Scenario: Open the Shop megamenu on desktop
    Given a desktop viewport with the global nav visible
    When the visitor activates the "Shop" menu item
    Then a megamenu panel opens beneath the nav showing top-level categories as columns with their subcategories listed under each heading

  @US1_shop_desktop_megamenu
  Scenario: Close the megamenu by moving input away
    Given the megamenu is open
    When the visitor moves the pointer away from both the "Shop" item and the panel
    Then the megamenu closes and the page returns to its normal state

  @US1_shop_desktop_megamenu
  Scenario: Navigate to a subcategory from the megamenu
    Given the megamenu is open
    When the visitor clicks a subcategory link
    Then they are taken to the corresponding category page and the megamenu closes

  @US1_shop_desktop_megamenu
  Scenario: Navigate to a category via Shop All
    Given the megamenu is open
    When the visitor clicks a "Shop All" link for a column
    Then they are taken to that top-level category's page and the megamenu closes

  @US2_shop_drilldown_mobile
  Scenario: Open the Shop drawer on mobile
    Given a mobile viewport with the global nav visible
    When the visitor taps "Shop"
    Then a full-screen menu drawer opens showing the top-level categories as a selectable list

  @US2_shop_drilldown_mobile
  Scenario: Advance to subcategories in the mobile drawer
    Given the top-level category list is showing
    When the visitor taps a category that has subcategories
    Then the drawer advances to a second panel showing that category's subcategories with a back control to return to the top-level list

  @US2_shop_drilldown_mobile
  Scenario: Advance to leaf subcategories in the mobile drawer
    Given a subcategory panel is showing
    When the visitor taps a subcategory that has further children
    Then the drawer advances to a third panel listing those leaf subcategories

  @US2_shop_drilldown_mobile
  Scenario: Navigate directly from a leaf category in the mobile drawer
    Given any category panel is showing
    When the visitor taps a category that has no children
    Then they are navigated to that category's page and the drawer closes

  @US2_shop_drilldown_mobile
  Scenario: Return to the previous level in the mobile drawer
    Given a sub-panel is showing
    When the visitor taps the back control
    Then the drawer returns to the previous level of the hierarchy

  @US3_miniatures_deep_nesting
  Scenario: Render nested children under the Miniatures subcategory on desktop
    Given the Miniatures category has subcategories and some subcategories have their own children
    When the visitor views the Miniatures megamenu column on desktop
    Then the top-level subcategories are shown and nested child ranges are grouped under their parent subcategory

  @US3_miniatures_deep_nesting
  Scenario: Keep the selected parent category visible in the panel
    Given a category with nested children
    When the visitor navigates to it
    Then the selected parent category remains visible in the header so the visitor knows where they are in the hierarchy

  @US3_miniatures_deep_nesting
  Scenario: Drill to the third level under Miniatures on mobile
    Given the Miniatures category on mobile
    When the visitor drills down through a subcategory to its children
    Then the third-level leaf list is shown and the back control returns to the subcategory level