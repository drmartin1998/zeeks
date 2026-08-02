# Implementation Readiness Checklist: Allowlisted Category Filtering

**Purpose**: Validate requirements quality, completeness, and clarity before implementation begins
**Created**: 2026-08-01
**Feature**: [spec.md](../spec.md)

**Note**: This checklist tests the REQUIREMENTS, not the implementation. Each item asks whether the spec/plan defines something clearly enough to implement correctly.

## Requirement Completeness

- [ ] CHK001 - Are requirements defined for what happens when only one of two allowlisted categories exists in Square? [Completeness, Spec §FR-004]
- [ ] CHK002 - Are requirements specified for the `/shop/[category]` route's behavior with allowlisted categories? [Gap, Spec §Edge Cases]
- [ ] CHK003 - Are requirements defined for how the filter interacts with the `isTopLevelCategory()` utility? [Gap, Spec §FR-006]
- [ ] CHK004 - Are requirements specified for how the allowlist is maintained (add/remove categories) over time? [Gap]
- [ ] CHK005 - Are the three static nav links (About Us, Locations, Sale) explicitly enumerated in requirements? [Completeness, Spec §FR-003]
- [ ] CHK006 - Are requirements defined for the case where both allowlisted categories are empty (no products assigned)? [Coverage, Gap]

## Requirement Clarity

- [ ] CHK007 - Is "gracefully fall back" in the edge cases section quantified with specific behavior (empty array? 404? hidden nav link?)? [Clarity, Spec §Edge Cases]
- [ ] CHK008 - Is the term "non-allowlisted categories" explicitly defined with an enumerated list or is it ambiguous (everything except the two IDs)? [Clarity, Spec §FR-005]
- [ ] CHK009 - Is "404 within 1 second" a measurable requirement consistent with SC-002, or should it specify under what conditions (cold start vs warm cache)? [Clarity, Spec §SC-002]
- [ ] CHK010 - Are the allowlisted category IDs documented in a single authoritative location, or are they scattered across spec, plan, and data-model? [Clarity, Spec §FR-001, Plan, Data-Model]

## Requirement Consistency

- [ ] CHK011 - Do FR-001 ("only include top-level categories with IDs") and FR-004 ("return only the categories that are present") align — i.e., does the system return an empty array or a partial array when one is missing? [Consistency, Spec §FR-001, §FR-004]
- [ ] CHK012 - Does SC-003 ("at most 2 top-level categories") conflict with SC-004 ("all existing tests pass") if existing test fixtures include >2 categories? [Consistency, Spec §SC-003, §SC-004]
- [ ] CHK013 - Is the allowlist filter placement consistent between the spec (FR-002 mentions `lib/square/catalog.ts`) and the plan (which also targets `fetchAllCategories()`)? [Consistency, Spec §FR-002, Plan]

## Acceptance Criteria Quality

- [ ] CHK014 - Are acceptance scenarios for US1 testable without knowledge of Square catalog state (i.e., do they specify exact expected outcomes)? [Measurability, Spec §US1]
- [ ] CHK015 - Can SC-001 ("exactly two Square-powered categories") be verified when only one allowlisted category exists in Square? [Measurability, Spec §SC-001]
- [ ] CHK016 - Is SC-004 ("all existing tests pass") too broad — does it include E2E tests that may depend on specific Square data? [Measurability, Spec §SC-004]
- [ ] CHK017 - Are the Gherkin scenarios' Given steps specific enough to set up test data without guesswork about what "exists in Square" means? [Measurability, Feature §US2 scenarios]

## Scenario Coverage

- [ ] CHK018 - Are requirements defined for the nav bar on mobile/responsive layouts when only two categories are shown? [Coverage, Gap]
- [ ] CHK019 - Are requirements specified for SEO/sitemap impact when non-allowlisted categories return 404? [Coverage, Gap]
- [ ] CHK020 - Are requirements defined for the transition period when a category is added to or removed from the allowlist? [Coverage, Gap]

## Edge Case Coverage

- [ ] CHK022 - Is the behavior specified when a user directly navigates to a non-allowlisted category page that previously worked (bookmarked URL)? [Edge Case, Spec §US2]
- [ ] CHK023 - Are requirements defined for what happens when a non-allowlisted category has subcategories assigned to it? [Edge Case, Gap]
- [ ] CHK024 - Is the behavior specified if the Square API returns category IDs in a different format or encoding? [Edge Case, Gap]
- [ ] CHK025 - Are requirements defined for the case where Miniatures and Hobby Supplies have overlapping products (cross-listed items)? [Edge Case, Gap]

## Non-Functional Requirements

- [ ] CHK026 - Are performance requirements specified for the filter operation itself (since plan states "<1ms overhead", is this a requirement or estimate)? [NFR, Plan §Performance Goals]
- [ ] CHK027 - Are security requirements defined for the hardcoded category IDs (preventing injection, ensuring IDs are validated)? [NFR, Gap]
- [ ] CHK028 - Are maintainability requirements specified for adding/removing allowlisted categories without code changes? [NFR, Gap]
- [ ] CHK029 - Are cache invalidation requirements defined when allowlisted categories change in Square? [NFR, Gap]

## Dependencies & Assumptions

- [ ] CHK030 - Is the assumption that both category IDs "are stable and will not change" validated against Square's documented ID stability guarantees? [Assumption, Spec §Assumptions]
- [ ] CHK031 - Is the assumption that "both categories exist in the Square production catalog" verified before deployment? [Assumption, Spec §Assumptions]
- [ ] CHK032 - Are the dependencies on existing subcategory filtering (spec `subcategory-filtering`) documented with explicit acceptance criteria that must still pass? [Dependency, Spec §FR-006]
- [ ] CHK033 - Is the assumption that "this is a production-only change" consistent with the testing strategy that uses mocked Square responses? [Assumption, Spec §Assumptions, Plan]

## Ambiguities & Conflicts

- [ ] CHK034 - Is there ambiguity between FR-001 (filter "wherever top-level categories are fetched") and the fact that `fetchAllCategories()` returns BOTH top-level and subcategory objects? [Ambiguity, Spec §FR-001, Data-Model]
- [ ] CHK035 - Does the spec's use of "Hobby Supplies" as a slug (`/categories/hobby-supplies`) conflict with Square's actual category name (which may differ from the slug)? [Ambiguity, Spec §US2]

## Notes

- Check items off as completed: `[x]`
- Items marked `[Gap]` indicate potentially missing requirements — consider adding to spec before implementation
- Items marked `[Ambiguity]` or `[Clarity]` indicate requirements that need refinement for unambiguous implementation
- Reference `[Spec §X.Y]` points to the feature specification; `[Plan]` to implementation plan; `[Feature]` to Gherkin file; `[Data-Model]` to data model doc

- [ ] CHK021 - Are requirements specified for how the filter behaves when Square API returns a partial or malformed response? [Coverage, Exception Flow]