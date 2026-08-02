# Feature Specification: Product Display Page

**Feature Branch**: `010-product-display-page`

**Created**: 2026-08-02

**Status**: Draft

**Input**: User description: "There is a product display page design now in the Figma. Create a new product display page when a user clicks on a product name anywhere in the site they should be taken to the items product display page. Utilize Square API's to populate the product display page content."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate to Product Detail from Anywhere (Priority: P1)

As a customer browsing the Zeeks store, when I click on any product name or product card anywhere on the site (homepage, category page, search results, or related products), I am taken to a dedicated product display page showing all details about that item — product image, price, description, and the ability to add it to my cart.

**Why this priority**: This is the core user journey for product discovery and purchase. Without a product detail page, customers cannot learn about products before buying, and there is no destination for product links across the site.

**Independent Test**: Click any product link on the site. Verify the browser navigates to `/products/[slug]` and displays the product's name, price, description, and image from Square. Verify the page matches the Figma design layout.

**Acceptance Scenarios**:

1. **Given** a product exists in the Square catalog and has a valid slug, **When** a user clicks that product's name on a category page, **Then** the browser navigates to `/products/[slug]` and displays the product's title, price, description, and primary image.
2. **Given** a product exists in the Square catalog, **When** a user clicks that product from the search results page, **Then** the browser navigates to `/products/[slug]` with the same product detail display.
3. **Given** a product slug does not exist in the Square catalog, **When** a user navigates to `/products/non-existent-product`, **Then** a 404 page is displayed with a clear "Product not found" message.
4. **Given** the product display page loads successfully, **When** the user views the page, **Then** the layout matches the Figma design for the product-detail-page frame including: breadcrumb navigation, product image, title, price, description, quantity selector, and add-to-cart button.

---

### User Story 2 - Rich Product Information (Priority: P2)

As a customer viewing a product detail page, I want to see comprehensive product information — including multiple images (if available), a detailed description, price, availability status, and any product variations (size, color, etc.) — so I can make an informed purchasing decision.

**Why this priority**: Rich product information drives purchase confidence. Without it, customers may abandon the product page. However, a basic page with core fields (title, price, image) is viable first.

**Independent Test**: Visit `/products/[slug]` for a product that has multiple images and a detailed description in Square. Verify all images are displayed in a gallery or carousel, the full description renders, and price is clearly shown.

**Acceptance Scenarios**:

1. **Given** a product in Square has multiple images, **When** a user views that product's detail page, **Then** all images are displayed in an image gallery (user can view each image), with the first image as the default.
2. **Given** a product in Square has a long description with formatting, **When** a user views that product's detail page, **Then** the description is displayed in full with preserved formatting (line breaks, paragraphs).
3. **Given** a product in Square has variations (e.g., sizes, colors), **When** a user views that product's detail page, **Then** available variations are displayed and the user can select one, which updates the displayed price and image if applicable.
4. **Given** a product in Square is out of stock, **When** a user views that product's detail page, **Then** the page displays an "Out of Stock" indicator and the add-to-cart button is disabled or replaced with a notification.

---

### User Story 3 - Breadcrumb Navigation & Related Products (Priority: P3)

As a customer on a product detail page, I want to see a breadcrumb trail showing the product's category hierarchy (Home > Category > Product) and related products from the same category, so I can easily navigate back to the category listing or discover similar items.

**Why this priority**: Breadcrumbs improve site navigation and SEO. Related products increase discovery and average order value. Important for user experience but the page is functional without them.

**Independent Test**: Visit `/products/[slug]` for a product in the "Miniatures" category. Verify the breadcrumb shows "Home > Miniatures > [Product Name]" and each breadcrumb link navigates correctly. Verify related products from the same category appear below the product details.

**Acceptance Scenarios**:

1. **Given** a product belongs to a top-level category (e.g., Miniatures), **When** a user views the product detail page, **Then** a breadcrumb trail displays "Home > Miniatures > [Product Name]" with clickable links for Home and the category.
2. **Given** a product belongs to a subcategory (e.g., Games Workshop under Miniatures), **When** a user views the product detail page, **Then** the breadcrumb displays "Home > Miniatures > Games Workshop > [Product Name]" with all parent segments clickable.
3. **Given** a product detail page is loaded, **When** the page renders, **Then** a "Related Products" section displays up to 4 other products from the same category (excluding the current product).

---

### Edge Cases

- What happens when a product has no images in Square? Display a placeholder image with the product's gradient background color.
- What happens when a product has no description in Square? Display a default message ("No description available") or omit the description section entirely.
- What happens when a product has no variations? Do not show the variations section — only show the quantity selector and add-to-cart button.
- What happens when the Square API is unreachable? Display a graceful error state with a "Product temporarily unavailable. Please try again." message and a link back to the previous page.
- What happens when a product slug contains special characters? The slug must be URL-encoded and decoded consistently with the existing slugify function used across the site.
- What happens when a user navigates directly to `/products/[slug]` via URL (not via site link)? The page must load independently — it cannot rely on client-side navigation state from a previous page.
- What happens when the same product slug exists in multiple Square locations? The location ID from the environment variable (`SQUARE_LOCATION_ID`) must be used to scope the product lookup.
- What happens when a product is assigned to a channel not visible online? The product detail page should return 404, consistent with the existing channel filter (FR-003 from spec 009).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every clickable product name or product card across the site (category pages, search results, homepage featured sections) MUST link to a dedicated product display page at the URL path `/products/[slug]`.
- **FR-002**: The product display page MUST fetch product data from the Square catalog, retrieving the product by its unique slug identifier. Product data MUST be fetched server-side, never exposed directly to the browser.
- **FR-003**: The product display page MUST display the following product fields from Square: title, primary image, price (in dollars), description, and availability status.
- **FR-004**: When a product has multiple images in Square, the page MUST display them in an image gallery or carousel, with the first image as the default visible image.
- **FR-005**: The product display page MUST include a breadcrumb navigation bar showing the category hierarchy from Home to the product, with clickable links for each segment.
- **FR-006**: The page MUST display product variations (if any exist in Square) and allow the user to select a variation, updating the displayed price and image accordingly.
- **FR-007**: When a product is out of stock, the page MUST display an "Out of Stock" indicator and disable the add-to-cart button.
- **FR-008**: The page layout MUST match the Figma design for the `product-detail-page` frame, including responsive variants for large (1440px), medium, and small viewports.
- **FR-009**: The product slug in the URL MUST be derived from the product title using the same URL-generation rules used across the site, ensuring consistency between linked product names and destination URLs (e.g., "Space Marines" → "space-marines").
- **FR-010**: The page MUST handle missing, channel-excluded, or invalid product slugs by returning a 404 response with a user-friendly "Product not found" message.
- **FR-011**: The page MUST display a "Related Products" section showing up to 4 other products from the same category, excluding the currently viewed product.

### Key Entities

- **Product (Square Catalog Item)**: Represents a sellable item from the Square catalog. Key attributes for this page: title, description, primary image, additional images (image gallery), price (derived from the first variation's price), currency, variations (name, price, image, SKU), inventory count, category assignments, and online visibility status.
- **Product Variation (Square Item Variation)**: A specific version of a product (e.g., size "Large", color "Red"). Each variation has its own price, SKU, image, and inventory tracking. The product detail page must display available variations and let the user select one.
- **Product Slug**: A URL-safe identifier derived from the product title (e.g., "Space Marines" → "space-marines"). Must be consistent with the slug generation used in product links on category pages and search results.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of product links across the site navigate to a valid product detail page that loads successfully.
- **SC-002**: The product detail page loads and displays core content (title, price, image) within 2 seconds on a standard broadband connection.
- **SC-003**: 100% of products with multiple images display all available images in the image gallery.
- **SC-004**: The breadcrumb navigation correctly reflects the product's category hierarchy for 100% of products that have category assignments.
- **SC-005**: Users can navigate from any product link on the site to the product detail page and back to the referring page in 3 clicks or fewer (including browser back button).

## Assumptions

- The product slug is generated consistently using the existing `slugify()` function in `lib/square/catalog.ts`, which is already used for category slugs.
- The product detail page is a Server Component that fetches data via a new Route Handler at `/api/catalog/products/[slug]`, consistent with Constitution Principles I and II.
- The Figma design (`product-detail-page` frame, node 90:997) is the authoritative design reference. Responsive variants exist at `product-detail-lg`, `product-detail-md`, and `product-detail-sm`.
- The existing `Product` Zod schema in `lib/square/types.ts` will be extended to include additional fields needed for the detail page (multiple images, variations, inventory, description).
- Square API image URLs are publicly accessible and can be used directly in `next/image` components.
- The add-to-cart functionality on the product detail page is handled by a future "Shopping Cart" feature. For v1 of this feature, the add-to-cart button is a visual element that will be wired up in a subsequent feature.
- The page will use Incremental Static Regeneration (ISR) with a revalidation period consistent with existing catalog pages (1 hour), per Constitution Principle V.
- Product data is scoped to the configured Square location (`SQUARE_LOCATION_ID`), consistent with existing catalog queries.
- The existing channel filter (`SQUARE_CHANNEL_ID`) applies to product detail lookups — products not in the target channel return 404.
