# Feature Specification: Product Search

**Feature Branch**: `012-search-products`
**Created**: 2026-08-02
**Status**: Draft
**Input**: "When a user searches for a keyword it should search items and return a product listing page with the search results. Wire the search component up to Square and create a search results page that looks and functions like a product listing page."

## User Scenarios & Testing

### User Story 1 - Search Products by Keyword (Priority: P1)

As a customer browsing the Zeeks store, I want to type a keyword into the search bar and see matching products from the Square catalog, so I can quickly find items I'm looking for.

**Acceptance Scenarios**:

1. **Given** the search bar is visible on the page, **When** a user types a keyword and submits the search, **Then** they are taken to a search results page at `/search?q=keyword` displaying products matching the keyword.
2. **Given** a search returns products from Square, **When** the results page loads, **Then** matching products are displayed in a product grid with titles, prices, and images — same layout as category listing pages.
3. **Given** a search keyword matches no products, **When** the results page loads, **Then** an empty state message is displayed ("No products found for '[keyword]'").
4. **Given** the search query is empty, **When** the search is submitted, **Then** the user stays on the current page (search is not submitted).

5. **Given** the Square API is unreachable or returns an error, **When** the search results page loads, **Then** an error message is displayed ("Search is temporarily unavailable. Please try again.") and the nav bar remains visible for navigation back.
6. **Given** a search is submitted, **When** results are loading, **Then** a loading skeleton or spinner is displayed in the results area.

## Requirements

- **FR-001**: The search bar MUST submit queries to a search results page at `/search?q=<keyword>`.
- **FR-002**: The search results page MUST fetch products from the Square catalog via a direct server-side `searchProductsByQuery()` call in a Server Component, using Square's `catalogApi.searchItems` with a `textFilter`.
- **FR-003**: The search results page MUST display results in a product grid matching the layout of category listing pages, including pagination.
- **FR-004**: Empty search results MUST display a clear "no results" message with the searched keyword visible.
- **FR-005**: The search bar MUST be present and functional on all pages via the nav bar, with consistent behavior across the site. The search input MUST have an accessible label (`aria-label="Search products"`) and support keyboard submission (Enter key).
- **FR-006**: The search results page MUST handle Square API errors gracefully by displaying a user-friendly error message without exposing internal details, per Constitution Principle V.
- **FR-007**: The search results page MUST display a loading indicator while fetching results from Square.

## Success Criteria

- **SC-001**: Users can search for products by keyword; the search results page renders server-side and streams results to the client with a perceived load time under 2 seconds.
- **SC-002**: Search results page layout matches category listing pages.
- **SC-003**: When the Square API is unreachable, the search page shows an error message within the same layout (no blank page or crash).

## Assumptions

- The search Route Handler at `/api/catalog/products/search?q=` already exists for client-side use; server-side search uses a direct SDK call to avoid Next.js self-fetch blocking.
- The search bar component in the nav bar already exists and needs only navigation wiring.
- The product listing page components (FilterBar, ProductGrid, Pagination) can be reused.
