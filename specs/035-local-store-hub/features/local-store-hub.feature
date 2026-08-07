Feature: Homepage Local Store Hub
  As a visitor browsing the Zeeks homepage
  I want to see a Local Store Hub section showing in-store community events
  So that I learn about upcoming events, tournaments, and community nights at the local store

  Background:
    Given the Zeeks homepage is loaded

  # ============================================================================
  # User Story 1 — See the Local Store Hub section on the homepage
  # Priority: P1 — MVP
  # ============================================================================

  @US1 @homepage_local_store_hub @priority-p1
  Scenario: The Local Store Hub section renders on the homepage
    Given a visitor loads the homepage
    When they scroll past New Arrivals
    Then they see the Local Store Hub section with a "Local Store Hub" heading and the subtitle "Upcoming events, tournaments, and community nights at your local Zeeks store."

  @US1 @homepage_local_store_hub @priority-p1
  Scenario: The section shows the event cards
    Given the Local Store Hub section is visible
    When the visitor views it
    Then it shows a row of event cards, each with a category badge, date/time, event title, and short description

  @US1 @homepage_local_store_hub @priority-p1
  Scenario: The section shows the "VIEW ALL EVENTS" link
    Given the Local Store Hub section is visible
    When the visitor looks at the header
    Then a "VIEW ALL EVENTS" link with an arrow is present that links to the events page

  # ============================================================================
  # User Story 2 — Event cards render the designed content
  # Priority: P1 — MVP
  # ============================================================================

  @US2 @event_cards_design @priority-p1
  Scenario: An event card shows the category badge in the accent color with white uppercase text
    Given the Local Store Hub renders
    When the visitor views an event card
    Then it shows a category badge in the accent color with white uppercase text

  @US2 @event_cards_design @priority-p1
  Scenario: An event card shows the designed meta, title, and description
    Given an event card
    When the visitor reads it
    Then the date/time appears in the accent orange, the event title is bold, and the description is muted

  @US2 @event_cards_design @priority-p1
  Scenario: Cards stack on small screens
    Given the homepage is viewed on a mobile screen
    When the Local Store Hub renders
    Then the cards stack vertically and remain readable

  # ============================================================================
  # User Story 3 — Section links navigate to the events destination
  # Priority: P2
  # ============================================================================

  @US3 @events_link @priority-p2
  Scenario: "VIEW ALL EVENTS" navigates to the events destination
    Given the Local Store Hub section is rendered
    When the visitor clicks "VIEW ALL EVENTS"
    Then they are taken to the events destination

  # ============================================================================
  # Edge Cases
  # ============================================================================

  @edge-case @empty-state @support
  Scenario: The section does not show mock events when none are available
    Given the homepage community data source returns no events
    When the Local Store Hub renders
    Then it shows an empty or neutral state and does not display placeholder event content
