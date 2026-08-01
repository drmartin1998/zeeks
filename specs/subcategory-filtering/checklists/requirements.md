# Requirements Checklist: Subcategory Browsing & Filtering

**Purpose**: Validate that all functional requirements, acceptance criteria, and quality gates are met.

**Created**: 2026-08-01

## Functional Requirements

- [x] CHK001 — System fetches products from parent Square category AND all child subcategories (FR-001)
- [x] CHK002 — Subcategory filter chips displayed above product grid when subcategories exist (FR-002)
- [x] CHK003 — "All" chip selected by default, showing all products (FR-003)
- [x] CHK004 — Selecting subcategory chip filters products by subCategorySlug (FR-004)
- [x] CHK005 — Filtering is client-side, no additional API calls (FR-005)
- [x] CHK006 — Products show subcategory association in card label (FR-006)
- [x] CHK007 — Zero mock data fallbacks in production code paths (FR-007)
- [x] CHK008 — Category pages return 404 when Square API unreachable (FR-008)
- [x] CHK009 — NavBar requires categories as explicit prop, no mock data import (FR-009)
- [x] CHK010 — Homepage Featured sections hide when Square data unavailable (FR-010)
- [x] CHK011 — Both /categories/[slug] and /shop/[category] support subcategory filtering (FR-011)
- [x] CHK034 — Active subcategory filter reflected in URL as ?sub=<slug> search param (FR-012)
- [x] CHK035 — Filter zero-results shows contextual empty state with "Show all" button (FR-013)
- [x] CHK036 — /categories/[slug] pagination: 12 per page, page number navigation (FR-014)
- [x] CHK037 — /categories/[slug] default sort is "Featured" (Square catalog order) (FR-015)

## Gherkin Scenario Coverage

- [x] CHK012 — @US1: View all products including subcategories
- [x] CHK013 — @US1: View category with no subcategories
- [x] CHK014 — @US1: View category with subcategories but no products (empty state)
- [x] CHK015 — @US2: Display subcategory filter chips
- [x] CHK016 — @US2: Filter products by subcategory chip
- [x] CHK017 — @US2: Reset filter to show all products
- [x] CHK038 — @US2: URL persistence — filter state survives refresh/share
- [x] CHK039 — @US2: Filter zero results — contextual empty state with "Show all"
- [x] CHK018 — @US3: Category page returns 404 when Square API is unreachable
- [x] CHK019 — @US3: NavBar shows only static links when Square API is unreachable
- [x] CHK020 — @US3: Homepage hides dynamic sections when Square API is unreachable

## Quality Gates

- [x] CHK021 — TypeScript: `tsc --noEmit` passes with zero errors
- [x] CHK022 — Lint: `npm run lint` passes with zero errors
- [x] CHK023 — Tests: `vitest run` passes all 22 test cases
- [x] CHK024 — E2E: Playwright tests cover subcategory filtering flow
- [x] CHK025 — Integration tests for CategoryProductGrid component
- [x] CHK026 — Unit tests for getSquareSubcategories() and updated getSquareProductsByCategorySlug()

## Edge Cases

- [x] CHK027 — 404 when category slug doesn't match any Square category
- [x] CHK028 — Empty state message when category exists but has zero products
- [x] CHK029 — No subcategory chips when category has no subcategories
- [x] CHK030 — Filter chips wrap on mobile viewport
- [ ] CHK031 — Product in multiple subcategories appears under all matching filters
- [x] CHK040 — Filtered view >12 products triggers pagination (12 per page)

## Rule & Documentation

- [x] CHK032 — `.clinerules/rules/no-mock-data-in-production.md` created
- [x] CHK033 — Spec, plan, and gherkin files created in `specs/subcategory-filtering/`

## Summary

| Category | Passed | Pending |
|----------|--------|---------|
| Functional Requirements | 11/15 | 4 (FR-012 URL params, FR-013 zero results, FR-014 pagination, FR-015 sort) |
| Gherkin Coverage | 9/11 | 2 (URL persistence, filter zero results) |
| Quality Gates | 3/6 | 3 (E2E, integration, unit tests) |
| Edge Cases | 4/6 | 2 (multi-subcategory, pagination) |
| Documentation | 2/2 | 0 |
| **Total** | **29/40** | **11** |

**Pending items**: 4 new FRs from clarification session (URL params, zero results state, pagination, default sort) need implementation. Tests (E2E, integration, unit) still pending. Existing functional requirements (FR-001 through FR-011) are all implemented.
