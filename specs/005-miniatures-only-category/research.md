# Research: Allowlisted Category Filtering

**Date**: 2026-08-01

## 1. Where to Apply the Category Filter

**Decision**: Add an `ALLOWED_CATEGORY_IDS` constant and filter inside `fetchAllCategories()` in `lib/square/catalog.ts`.

**Rationale**: `fetchAllCategories()` is the single internal helper that all category consumers call. Filtering here means nav bar (`getNavCategories` via `lib/data/categories.ts`), category pages (`getSquareCategories`, `getSquareCategoryBySlug`, `getSquareProductsByCategorySlug`), and the API route (`GET /api/catalog/categories`) all automatically receive only allowlisted categories with zero changes.

**Alternatives considered**:
- Filter at each consumer individually: Redundant, error-prone, violates DRY.
- Filter in the API route only: Would miss direct server component calls (nav bar, category pages).

## 2. Filter Implementation Strategy

**Decision**: Use a `Set` for O(1) lookups via `Array.filter()` on the already-fetched category array.

**Rationale**: After `catalogApi.search()` returns all categories, filter in-memory before returning. A Set lookup adds negligible overhead (<1ms for typical catalog sizes). The filter is applied after the Square API call but before any consumer receives the data.

**Alternatives considered**:
- Filter at the API request level (e.g., Square's search filters): Square API does not support filtering categories by ID list. Must filter post-fetch.
- Environment-variable-driven allowlist: Adds unnecessary complexity; the IDs are business-specific constants, not deployment-configuration.

## 3. Handling Missing Allowlisted Categories

**Decision**: Silently handle missing categories — if an allowlisted ID doesn't exist in the Square response, simply don't include it in results.

**Rationale**: FR-004 specifies "return only the categories that are present, not an error." A missing category (e.g., deleted from Square Dashboard) is not an application error — it means that category should no longer appear. The filter naturally handles this: `filter()` returns only matching IDs that exist.

## 4. Impact on Subcategory Filtering

**Decision**: Subcategory logic remains unchanged.

**Rationale**: The subcategory filtering feature (spec `subcategory-filtering`) runs AFTER top-level category resolution. Since `fetchAllCategories()` returns ALL categories (including subcategories) and only the top-level filter is added, subcategories of allowlisted categories continue to work correctly via their `parentCategory.id` matching. The `isTopLevelCategory()` check is applied separately at each consumer, so subcategories are never surfaced as top-level nav items.

## 5. Test Strategy

**Decision**: Update existing unit/integration tests to verify the filter, rather than creating new test files.

**Rationale**: The filter is a single-function change. Existing test files already mock `@/lib/square/client` and control the catalog response. Adding test cases for the filter behavior in `lib/square/__tests__/catalog.test.ts`, `lib/data/__tests__/categories.test.ts`, and `app/api/catalog/categories/__tests__/route.test.ts` provides full coverage without additional test infrastructure.

## 6. Hardcoded IDs

**Decision**: Define `ALLOWED_CATEGORY_IDS` as a `const` array in `lib/square/catalog.ts`.

**Rationale**: The category IDs are business requirements, not deployment configuration. A simple constant array is the clearest expression of intent. If IDs change, the source code must be updated (documented in spec assumptions).
