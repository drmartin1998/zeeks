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

## Gherkin Scenario Coverage

- [x] CHK012 — @US1: View all products including subcategories
- [x] CHK013 — @US1: View category with no subcategories
- [x] CHK014 — @US1: View category with subcategories but no products (empty state)
- [x] CHK015 — @US2: Display subcategory filter chips
- [x] CHK016 — @US2: Filter products by subcategory chip
- [x] CHK017 — @US2: Reset filter to show all products
- [x] CHK018 — @US3: Category page returns 404 when Square API is unreachable
- [x] CHK019 — @US3: NavBar shows only static links when Square API is unreachable
- [x] CHK020 — @US3: Homepage hides dynamic sections when Square API is unreachable

## Quality Gates

- [x] CHK021 — TypeScript: `tsc --noEmit` passes with zero errors
- [x] CHK022 — Lint: `npm run lint` passes with zero errors
- [x] CHK023 — Tests: `vitest run` passes all 22 test cases
- [ ] CHK024 — E2E: Playwright tests cover subcategory filtering flow
- [ ] CHK025 — Integration tests for CategoryProductGrid component
- [ ] CHK026 — Unit tests for getSquareSubcategories() and updated getSquareProductsByCategorySlug()

## Edge Cases

- [x] CHK027 — 404 when category slug doesn't match any Square category
- [x] CHK028 — Empty state message when category exists but has zero products
- [x] CHK029 — No subcategory chips when category has no subcategories
- [x] CHK030 — Filter chips wrap on mobile viewport
- [ ] CHK031 — Product in multiple subcategories appears under all matching filters

## Rule & Documentation

- [x] CHK032 — `.clinerules/rules/no-mock-data-in-production.md` created
- [x] CHK033 — Spec, plan, and gherkin files created in `specs/subcategory-filtering/`

## Summary

| Category | Passed | Pending |
|----------|--------|---------|
| Functional Requirements | 11/11 | 0 |
| Gherkin Coverage | 9/9 | 0 |
| Quality Gates | 3/6 | 3 (E2E, integration, unit tests) |
| Edge Cases | 4/5 | 1 (multi-subcategory products) |
| Documentation | 2/2 | 0 |
| **Total** | **29/33** | **4** |

**Pending items**: Tests (E2E, integration, unit) — the feature code is implemented but test coverage needs to be written following the Testing Trophy.
