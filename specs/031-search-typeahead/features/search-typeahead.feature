Feature: Search Typeahead
  As a shopper browsing the Zeeks store
  I want to see product suggestions as I type in the search bar
  So that I can quickly find and jump to the products I want

  Background:
    Given the system is ready for typeahead search

  @US1_suggestions_while_typing
  Scenario: Show product suggestions as the shopper types
    Given a shopper focuses the search input
    When they type a keyword
    Then a dropdown panel appears showing matching product suggestions

  @US1_suggestions_while_typing
  Scenario: Suggestions update as the shopper continues typing
    Given a shopper has typed a partial keyword
    When they continue typing
    Then the suggestions update to reflect the full text

  @US1_suggestions_while_typing
  Scenario: Select a suggestion to open the product
    Given the search input shows a query
    When the shopper clicks a suggested product
    Then they navigate to that product's detail page

  @US2_results_count_and_view_all
  Scenario: Show the number of matching results
    Given a shopper has typed a query with matching products
    When the dropdown renders
    Then it displays the number of matching results

  @US2_results_count_and_view_all
  Scenario: View all results opens the search results page
    Given the dropdown shows suggestions
    When the shopper selects "View all results"
    Then they are taken to the full search results page for their query

  @US3_clear_and_empty_state
  Scenario: Clear the search query with the clear control
    Given a shopper has typed a query
    When they use the clear control
    Then the input is emptied and the suggestion dropdown closes

  @US3_clear_and_empty_state
  Scenario: Show an empty state for a query with no matches
    Given a shopper types a query with no matching products
    When the dropdown renders
    Then it shows a "no products found" message with the query and example alternative searches

  @US4_navigation_search_bar
  Scenario: Typeahead is available in the navigation search bar
    Given a shopper is on any page
    When they type in the navigation search bar
    Then a typeahead dropdown of suggestions appears

  @US4_navigation_search_bar
  Scenario: Submitting a query still navigates to search results
    Given a shopper submits a query via the search bar
    When they press Enter or the search button
    Then they are taken to the search results page as before