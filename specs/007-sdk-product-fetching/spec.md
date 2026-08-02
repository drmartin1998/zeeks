# Feature Specification: SDK-Only Product Fetching

**Feature Branch**: `007-sdk-product-fetching`

**Created**: 2026-08-01

**Status**: Draft

**Input**: User description: "when fetching products always use the sdk"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Products via SDK-Backed Catalog (Priority: P1)

A customer visits the Zeeks storefront and browses the product catalog. Every product displayed on any page—the home page, category pages, search results, and individual product detail pages—is fetched exclusively through the Square SDK on the server side. The customer never receives mock data, cached fallbacks without a live source, or data from any alternative pathway.

**Why this priority**: This is the architectural foundation of the entire storefront. Without it, customers may see incorrect pricing, stale inventory, or placeholder data that doesn't reflect the actual Square catalog. It directly implements Constitution Principles I (Server Components First), II (API Route Security), and VII (No Mock Data Fallback).

**Independent Test**: Can be verified by deploying the storefront, visiting any product page, and confirming the displayed products match the live Square catalog. Verification can be done by comparing displayed product names, prices, and images against the Square merchant dashboard.

**Acceptance Scenarios**:

1. **Given** the storefront home page, **When** a customer loads the page, **Then** all displayed products are fetched via the Square SDK and match the live Square catalog for the configured location.
2. **Given** a category page, **When** a customer navigates to it, **Then** all products in that category are fetched via the Square SDK, and only products actually in that category in Square are displayed.
3. **Given** a product detail page, **When** a customer clicks on a specific product, **Then** the product details (name, description, price, images, inventory status) are fetched from Square SDK and accurately reflect the current Square catalog data.
4. **Given** a search query, **When** a customer searches for products, **Then** search results are retrieved via the Square SDK's search catalog endpoint and no mock or hardcoded products appear in results.

---

### User Story 2 - Graceful Error Handling on SDK Failure (Priority: P2)

When the Square SDK encounters an error (network timeout, API rate limit, invalid configuration, or Square service outage), the storefront displays a clear, user-friendly error state instead of silently falling back to mock data or presenting a broken page.

**Why this priority**: While SDK reliability is expected, failures must degrade gracefully. Mock data must never be substituted for live data under any circumstance, per Constitution Principle VII.

**Independent Test**: Can be tested by temporarily providing invalid Square credentials (or a non-existent location ID) and verifying that all product-displaying pages show appropriate error messages rather than mock data or blank pages.

**Acceptance Scenarios**:

1. **Given** the Square API is unreachable, **When** a customer loads any product page, **Then** a clear error message is displayed indicating that products are temporarily unavailable, with no mock or fallback product data shown.
2. **Given** the Square SDK returns a rate-limited response, **When** the storefront attempts to fetch products, **Then** the system retries with appropriate backoff and shows an error state only after all retries are exhausted.
3. **Given** the Square SDK returns an empty catalog (no products configured), **When** a customer views the storefront, **Then** an appropriate "no products available" message is displayed rather than fallback mock products.


---

### User Story 3 - Consistent SDK Usage Across All Product Endpoints (Priority: P3)

Developers and code reviewers can verify that every code path that retrieves product data—across route handlers, server components, and server actions—uses the Square SDK exclusively. No code path bypasses the SDK for mock data, direct REST calls, or hardcoded product lists in production.

**Why this priority**: This ensures ongoing compliance with the architectural mandate as the codebase evolves. It prevents future regressions where new features might inadvertently introduce non-SDK data sources.

**Independent Test**: Can be verified through code review and automated static analysis—every import from mock data modules (`@/lib/data`) in production code paths triggers a lint/CI failure.

**Acceptance Scenarios**:

1. **Given** the production codebase, **When** any import of `@/lib/data` or similar mock data modules is present outside of test files, **Then** the build or lint step fails.
2. **Given** a new feature branch, **When** a developer attempts to merge code that uses non-SDK product fetching in a production path, **Then** CI checks block the merge.

---

### Edge Cases

- What happens when the Square SDK returns partial results (e.g., some products loaded, some failed)? The system should display what it can while clearly indicating incomplete results.
- What happens when a product in the Square catalog has missing required fields (e.g., no price, no image)? The storefront should handle missing data gracefully, showing appropriate placeholders or omitting the product if it's not displayable.
- What happens when the Square SDK version is updated and breaking changes occur? The existing type definitions and Route Handler interfaces must be updated before merging.
- How does the system handle very large catalogs (thousands of products)? Pagination and cursor-based fetching must work through the SDK.
- What happens when multiple concurrent requests hit the same catalog data? Caching at the server level (per Constitution Principle V) should prevent unnecessary duplicate SDK calls.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST fetch all product data exclusively through the Square SDK (server-side) via Next.js Route Handlers.
- **FR-002**: The system MUST NOT import or reference mock data modules (`@/lib/data`, `@/lib/data/products.ts`, or similar) in any production code path (non-test files).
- **FR-003**: The system MUST NOT contain hardcoded product data, inline product literals, or `FALLBACK_*` constants used as substitutes for live Square data in production code.
- **FR-004**: The system MUST display a user-friendly error state when the Square SDK is unavailable, returns an error, or returns empty results—never substitute mock data.
- **FR-005**: The system MUST implement retry logic with exponential backoff for transient Square SDK failures (network timeouts, rate limits).
- **FR-006**: The system MUST handle partial SDK response failures gracefully, displaying available results while indicating incomplete data.
- **FR-007**: The system MUST cache Square SDK responses on the server side (per Constitution Principle V) to reduce redundant API calls, with cache invalidation on catalog updates.
- **FR-008**: The system MUST validate all Square SDK responses with Zod schemas before passing data to components.
- **FR-009**: The system MUST use typed interfaces (defined in `lib/square/types.ts`) for all Square SDK response objects.
- **FR-010**: All Square SDK calls MUST be routed through Next.js Route Handlers (`app/api/**/route.ts`)—never called directly from client components.

### Key Entities

- **Product**: Represents a catalog item from Square. Key attributes include name, description, price (in the location's currency), images, inventory count, category, and Square catalog item ID.
- **Category**: A Square catalog category that groups products for browsing and filtering.
- **Catalog API Response**: The typed, validated response from a Square SDK `catalogApi.listCatalog()` or `catalogApi.searchCatalogItems()` call, transformed into an application-specific Product type.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of product data displayed in the storefront originates from Square SDK calls in production—zero instances of mock or hardcoded product data.
- **SC-002**: When the Square SDK is unavailable, 100% of product pages display an error state within 5 seconds rather than showing stale, incorrect, or mock data.
- **SC-003**: Product page load times remain under 2 seconds for catalogs up to 500 items (with server-side caching per Constitution Principle V).
- **SC-004**: 100% of production code paths that display product data pass automated checks that verify no mock data imports exist outside of test files.
- **SC-005**: Square SDK call coverage—every product-related user-facing feature (browse, search, detail view, category filter) uses the SDK as its sole data source.

## Assumptions

- The Square SDK (`square` npm package) is already installed and configured with valid `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID` environment variables.
- All existing product-displaying pages (home, category, search, product detail) will be updated to use SDK-backed Route Handlers rather than any current non-SDK data sources.
- The Square catalog is properly configured in the Square merchant dashboard and contains products available at the configured location.
- Server-side caching (e.g., Next.js `cache()` or Vercel Data Cache) is acceptable and aligns with Constitution Principle V (Performance & Caching).
- Existing Route Handler patterns (`app/api/**/route.ts`) and Zod validation patterns in the codebase serve as the template for any new SDK-backed endpoints.
- Test files (`*.test.*`, `__tests__/`) are exempt from the no-mock-data rule when using MSW handlers for integration testing.
- The `@/lib/data` directory and any similar mock data modules exist for testing purposes only and are explicitly excluded from production code paths by this specification.


