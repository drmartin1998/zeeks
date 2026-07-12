Feature: {FEATURE_TITLE}
  As a {USER_ROLE}
  I want to {GOAL}
  So that {BENEFIT}

  Background:
    Given the application is in a ready state
    And the user is authenticated
    And the necessary data fixtures are loaded

  # ============================================================================
  # User Story 1 — {US1_TITLE}
  # Priority: P1 — MVP
  # ============================================================================

  @US1 @{US1_SLUG} @priority-p1
  Scenario: {US1_SCENARIO_1_TITLE}
    Given {US1_SCENARIO_1_GIVEN}
    When {US1_SCENARIO_1_WHEN}
    Then {US1_SCENARIO_1_THEN}

  @US1 @{US1_SLUG} @priority-p1
  Scenario: {US1_SCENARIO_2_TITLE}
    Given {US1_SCENARIO_2_GIVEN}
    When {US1_SCENARIO_2_WHEN}
    Then {US1_SCENARIO_2_THEN}

  # ============================================================================
  # User Story 2 — {US2_TITLE}
  # Priority: P2
  # ============================================================================

  @US2 @{US2_SLUG} @priority-p2
  Scenario: {US2_SCENARIO_1_TITLE}
    Given {US2_SCENARIO_1_GIVEN}
    When {US2_SCENARIO_1_WHEN}
    Then {US2_SCENARIO_1_THEN}

  # ============================================================================
  # Edge Cases
  # ============================================================================

  @edge-case @error-handling
  Scenario: {EDGE_CASE_SCENARIO_TITLE}
    Given {EDGE_CASE_GIVEN}
    When {EDGE_CASE_WHEN}
    Then {EDGE_CASE_THEN}
