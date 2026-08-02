# Tasks: SDK-Only Product Fetching

**Input**: Design documents from `/specs/007-sdk-product-fetching/`

**Prerequisites**: plan.md (✓), spec.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓)

**Tests**: Following the Testing Trophy (Kent C. Dodds), every user story MUST include test tasks. Integration tests are the largest investment; E2E for critical paths only. Tests MUST be written FIRST and FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js App Router**: `app/`, `lib/`, `components/`
- **Tests**: `__tests__/` co-located alongside the module; E2E in `tests/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared utilities and schemas that all subsequent phases depend on.

- [X] T001 [P] Add Zod schemas for Square SDK catalog responses in `lib/square/types.ts` (CatalogCategorySchema, CatalogItemSchema, CatalogSearchResponseSchema, ProductSchema, SearchParamsSchema, ErrorResponseSchema)
- [X] T002 [P] Implement retry utility `withRetry()` with exponential backoff and jitter in `lib/utils.ts` (max 3 retries, 500ms base, 2x multiplier, ±100ms jitter)
- [X] T003 Verify `tsc --noEmit` and `npm run lint` pass after T001-T002

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story Route Handler is implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 [P] Unit test for Zod schemas (CatalogCategorySchema, ProductSchema, SearchParamsSchema) in `lib/square/__tests__/validation.test.ts`
- [X] T005 [P] Unit test for `withRetry()` utility in `lib/__tests__/utils.test.ts`
- [X] T006 Create shared Route Handler response helpers in `lib/api-helpers.ts`: `apiSuccess<T>(data)`, `apiError(message, status)`, `apiNotFound(message)`, `apiServerError(message)`
- [X] T007 [P] Unit test for api-helpers response utilities in `lib/__tests__/api-helpers.test.ts`
- [X] T008 Refactor `lib/square/catalog.ts` to remove direct `catalogApi` imports — extract pure data transforms that don't call the SDK: `slugify()`, `normalizePrice()`, `toProduct()` mapper. Keep `getSquareCategories()`, `getSquareProductsByCategorySlug()`, etc. as deprecated wrappers that call new Route Handlers internally via `fetch()`.

**Checkpoint**: Foundation ready — shared schemas, retry utility, response helpers, and refactored catalog transforms are in place. Route Handler implementations can now begin.

---

## Phase 3: User Story 1 - Browse Products via SDK-Backed Catalog (Priority: P1) 🎯 MVP

**Goal**: Every product displayed on any page is fetched exclusively through Square SDK via Route Handlers. Customers browsing the homepage, category pages, search results, and product detail pages see only live Square catalog data.

**Independent Test**: Deploy and visit the homepage, category pages, and search. Verify all displayed products match the Square sandbox catalog. Run `grep -r "from.*@/lib/data[^/]" app/` — must produce zero results.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

> Write these tests FIRST, ensure they FAIL, then implement.

- [X] T009 [P] [US1] Integration test for GET /api/catalog/products Route Handler with MSW-mocked Square SDK in `app/api/catalog/products/__tests__/route.test.ts`
- [X] T010 [P] [US1] Integration test for GET /api/catalog/products/search Route Handler with MSW-mocked Square SDK in `app/api/catalog/products/search/__tests__/route.test.ts`
- [X] T011 [P] [US1] Integration test for GET /api/catalog/products/[id] Route Handler with MSW-mocked Square SDK in `app/api/catalog/products/[id]/__tests__/route.test.ts`
- [X] T012 [P] [US1] Integration test for Homepage Server Component rendering SDK-backed products via MSW in `app/__tests__/homepage.test.tsx`
- [X] T013 [P] [US1] Integration test for Category page Server Component rendering SDK-backed products via MSW in `app/categories/[slug]/__tests__/page.test.tsx`

### Implementation for User Story 1

- [X] T014 [US1] Create GET /api/catalog/products Route Handler in `app/api/catalog/products/route.ts` — accepts `?slug=` and optional `?cursor=`, calls `catalogApi.searchItems()` with retry, validates response with Zod, transforms to Product[], returns JSON with Cache-Control headers
- [X] T015 [P] [US1] Create GET /api/catalog/products/search Route Handler in `app/api/catalog/products/search/route.ts` — accepts `?q=` and optional `?cursor=`, calls `catalogApi.searchItems()` with textQuery filter, validates with Zod, returns JSON with Cache-Control headers
- [X] T016 [P] [US1] Create GET /api/catalog/products/[id] Route Handler in `app/api/catalog/products/[id]/route.ts` — accepts catalog item ID as path param, calls `catalogApi.retrieveCatalogObject()`, validates with Zod, returns single Product JSON with Cache-Control headers
- [X] T017 [US1] Refactor `app/page.tsx` Homepage to fetch products via `fetch("/api/catalog/products?slug=miniatures")` from the Route Handler instead of calling `getSquareProductsByCategorySlug()` directly — handle null/empty results with conditional rendering
- [X] T018 [US1] Refactor `app/categories/[slug]/page.tsx` to fetch products via `fetch("/api/catalog/products?slug=${slug}")` from the Route Handler instead of calling `getSquareProductsByCategorySlug()` directly — preserve existing subcategory filtering logic
- [X] T019 [US1] Refactor `app/shop/[category]/page.tsx` to fetch products via `fetch("/api/catalog/products?slug=${category}")` instead of calling `getSquareProductsByCategorySlug()` — and replace `getNavCategories()` import from `@/lib/data/categories` with `fetch("/api/catalog/categories")`
- [X] T020 [US1] Mark `lib/data.ts` exports (FEATURED_GAMES, ALL_PRODUCTS, CATEGORIES, getCategoryBySlug, getProductsByCategorySlug) as `@deprecated` in JSDoc; add ESLint `no-restricted-imports` rule to block production imports from `@/lib/data` in `eslint.config.mjs`
- [X] T021 [US1] Mark `lib/data/products.ts` as test-only in JSDoc comments; add header comment: "TEST-ONLY: Not for production use."
- [X] T022 [US1] Run `grep -r "from.*@/lib/data[^/]" app/` and `grep -r "FALLBACK_" app/ lib/` — confirm zero results in production paths

**Checkpoint**: All product-displaying pages use Route Handlers. No mock data imports in production. SDK-backed catalog is the sole data source.

---

## Phase 4: User Story 2 - Graceful Error Handling on SDK Failure (Priority: P2)

**Goal**: When the Square SDK encounters an error, the storefront displays clear, user-friendly error states instead of silently failing or substituting mock data.

**Independent Test**: Temporarily set invalid Square credentials, load each product page, and verify error banners appear within 5 seconds with no mock data visible. Verify retry behavior by inspecting server logs.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

> Write these tests FIRST, ensure they FAIL, then implement.

- [ ] T023 [P] [US2] Integration test for Route Handler error responses (502 with message) when Square SDK throws in `app/api/catalog/products/__tests__/route.test.ts` (extend T009)
- [ ] T024 [P] [US2] Integration test for Category page error state rendering in `app/categories/[slug]/__tests__/error-state.test.tsx` — mock Route Handler returning 502, verify error banner renders, no mock products
- [X] T025 [P] [US2] Unit test for retry exhaustion behavior — verify withRetry() stops after 3 failures and returns last error in `lib/__tests__/utils.test.ts` (extend T005)

### Implementation for User Story 2

- [X] T026 [US2] Create shared `ErrorBanner` component in `components/error-banner.tsx` — displays user-friendly message ("Products temporarily unavailable. Please try again."), optional retry button, accessible role="alert"
- [X] T027 [P] [US2] Create shared `EmptyState` component in `components/empty-state.tsx` — displays "No products available" message when Square returns empty catalog (0 items), distinguishable from error state
- [X] T028 [US2] Add error state handling to `app/page.tsx` Homepage — when fetch to /api/catalog/products fails, render ErrorBanner instead of empty product grid; do NOT render mock products
- [X] T029 [US2] Add error state handling to `app/categories/[slug]/page.tsx` — when fetch fails, render ErrorBanner; when category not found (404), keep existing `notFound()` behavior
- [X] T030 [US2] Add error state handling to `app/shop/[category]/page.tsx` — when fetch fails, render ErrorBanner in ProductListingPage; pass error prop to component
- [X] T031 [US2] Ensure all Route Handlers (T014-T016) log Square SDK errors via `console.error` with structured context (endpoint name, error type, status code) for debugging
- [X] T032 [US2] Verify SC-002: When Square SDK is unavailable, 100% of product pages display error state within 5 seconds — manual verification with invalid credentials

**Checkpoint**: All product pages degrade gracefully on SDK failure. Zero mock data fallback. Retry logic functional. Error states are user-friendly and accessible.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation.

- [X] T033 [P] Add ISR `revalidate` to category listing pages (`app/categories/[slug]/page.tsx` and `app/shop/[category]/page.tsx`) with a 1-hour interval to reduce Square API calls per Constitution IV
- [ ] T034 [P] E2E test: Homepage loads products from SDK in `tests/e2e/homepage.spec.ts`
- [ ] T035 [P] E2E test: Category page loads products and subcategories from SDK in `tests/e2e/category-page.spec.ts`
- [ ] T036 Run full quickstart.md validation: `tsc --noEmit && npm run lint && npm test && npm run test:e2e`
- [ ] T037 Run mock data verification scripts from quickstart.md: grep checks for `@/lib/data` imports and `FALLBACK_` constants in production paths

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on US1 Route Handlers being created (tests can start in parallel)
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 Route Handlers (T014-T016) being created — error states wrap the same endpoints. Tests (T023-T025) can start in parallel with US1 implementation.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Route Handlers before Server Component refactors
- Core implementation before error state wiring
- Story complete before moving to next priority

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T004 and T005 can run in parallel (different test files)
- T009, T010, T011, T012, T013 can ALL run in parallel (different test files for different endpoints/pages)
- T014, T015, T016 can run in parallel (different Route Handler files)
- T017, T018, T019 are sequential (depend on Route Handlers existing)
- T023, T024, T025 can run in parallel (different test files)
- T026, T027 can run in parallel (different component files)
- T033, T034, T035 can run in parallel

---

## Parallel Example: User Story 1 Tests + Route Handlers

```bash
# Launch all US1 integration tests together (they'll FAIL initially):
Task: "T009 Integration test for GET /api/catalog/products Route Handler"
Task: "T010 Integration test for GET /api/catalog/products/search Route Handler"
Task: "T011 Integration test for GET /api/catalog/products/[id] Route Handler"
Task: "T012 Integration test for Homepage Server Component"
Task: "T013 Integration test for Category page Server Component"

# After tests are written (and failing), launch all Route Handlers in parallel:
Task: "T014 Create GET /api/catalog/products Route Handler"
Task: "T015 Create GET /api/catalog/products/search Route Handler"
Task: "T016 Create GET /api/catalog/products/[id] Route Handler"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T008)
3. Complete Phase 3: User Story 1 (T009-T022)
4. **STOP and VALIDATE**: Test US1 independently — browse all pages, verify SDK data, confirm zero mock imports
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Shared schemas, retry, helpers ready
2. Add User Story 1 → All pages use SDK via Route Handlers → Deploy/Demo (MVP!)
3. Add User Story 2 → Error states, retry visible, no mock fallback → Deploy/Demo
4. Add Polish → ISR caching, E2E tests, final validation → Production-ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 Route Handlers (T014-T016)
   - Developer B: US1 Server Component refactors (T017-T019)
   - Developer C: US1 + US2 tests (T009-T013, T023-T025)
3. US1 complete → Developer A: US2 error components (T026-T027), Developer B: US2 page integration (T028-T030)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- **Constitution II**: All SDK calls MUST go through Route Handlers — verify after T014-T016
- **Constitution VII**: Zero mock data in production — verify after T022 and T032
- **Constitution VI**: Gherkin `.feature` file MUST exist before `speckit-implement` — run `/speckit-gherkin-sync`
