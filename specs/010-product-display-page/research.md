# Research: Product Display Page

**Feature**: 010-product-display-page
**Date**: 2026-08-02
**Updated**: 2026-08-02 (post-implementation bug fix)

## 1. Product Slug Resolution Strategy

**Decision**: Resolve product slugs via `catalogApi.search({ objectTypes: ["ITEM"] })` — the same proven method used by `fetchAllCategories()` — and match by slugified name.

**Rationale**: Square does not natively support slug-based product lookups. The catalog is small (~50 products across 2 categories), making a full-item fetch practical.

**Implementation**: 
1. Call `catalogApi.search({ objectTypes: ["ITEM"], includeDeletedObjects: false })` to fetch all items
2. Filter items by type === "ITEM" and slugified name match
3. Retrieve full details via `catalogApi.batchGet({ objectIds: [matchedId], includeRelatedObjects: true })` to get images
4. Resolve category breadcrumbs via `fetchAllCategories()`
5. Return enriched ProductDetail with images, variations, category info, and related products

**Post-Implementation Fix (2026-08-02)**: The initial implementation used `catalogApi.searchItems({ enabledLocationIds: [locationId], limit: 500 })` but this returned zero results. Root cause: `SearchCatalogItems` requires at least one filter (`textFilter`, `categoryIds`, or `productTypes`) alongside `enabledLocationIds`. Switched to `catalogApi.search()` which is the proven method already used in `fetchAllCategories()` and requires only `objectTypes`. Additionally, the page component initially used `fetch()` to call its own API route during server-side rendering, which Next.js blocks. Fixed by calling `getProductDetailBySlug()` directly from the page component.

**Alternatives considered**:
- ~~`catalogApi.searchItems()` with `enabledLocationIds`~~: Failed — returned zero results (needs additional filter params).
- **URL-encoded ID** (`/products/[id]-[slug]`): Cleaner lookup but exposes Square IDs in URLs and requires coordination with all link generators.
- **Category-scoped search**: Would require knowing the parent category before lookup — adds complexity for direct URL navigation.
- **Pre-built slug index**: Over-engineering for ~50 products; would require maintenance when products change.

## 2. Square API Image Resolution

**Decision**: Resolve image IDs from `itemData.imageIds[]` via `catalogApi.batchGet()` with `includeRelatedObjects: true`.

**Rationale**: Square stores images as separate catalog objects referenced by ID in `itemData.imageIds`. Using `batchGet` with `includeRelatedObjects: true` returns the image objects alongside the item, providing direct URLs. The image URLs from Square are publicly accessible and work with `next/image`.

**Implementation**:
- `catalogApi.batchGet({ objectIds: [itemId], includeRelatedObjects: true })`
- Parse returned `relatedObjects` for type `IMAGE`
- Extract `imageData.url` for each image
- Map to `string[]` of URLs for the gallery

**Fallback**: If no images exist, use the product's gradient background as a placeholder.

## 3. Figma Design Analysis

**Decision**: Match the Figma `product-detail-page` frame layout (node 90:997).

**Key design elements identified**:
- **Nav bar**: Existing `nav-bar` component (Instance of component set `98:703`)
- **Search bar**: Existing `search-bar` component (Instance of `8:54`)
- **Breadcrumb bar**: Existing `breadcrumb-bar` component (Instance of `100:2307`)
- **Product image**: Large hero image with gallery thumbnails
- **Product info section**: Title, price, description, variations dropdown, quantity input, add-to-cart button
- **Related products**: Grid of 4 `product-card` components (Instance of `8:47`)
- **Footer**: Existing `footer` component (Instance of `100:1771`)

**Responsive variants**: `product-detail-lg` (1440px), `product-detail-md`, `product-detail-sm`

All sub-components (nav-bar, search-bar, breadcrumb-bar, product-card, footer) already exist in the codebase.

## 4. Existing Codebase Integration

**Decision**: Extend existing catalog layer rather than create parallel implementation.

**Integration points**:
- **`lib/square/catalog.ts`**: The `slugify()` and `normalizePrice()` functions are already exported and reusable. Add `getProductDetailBySlug()` function for server-side product lookup.
- **`lib/square/types.ts`**: Extend with `ProductDetail` type (includes images, variations, category path, inventory) and Zod schema.
- **`app/api/catalog/products/[id]/route.ts`**: Existing ID-based route handler. New slug-based handler is separate to preserve the existing API.
- **Product listing pages**: Existing `ProductGrid` and product cards need `<Link>` wrappers around product titles.
- **Channel filter**: The existing channel filter (`fetchAllCategories()`) ensures only channel-eligible products are accessible; the slug Route Handler must align with this.

## 5. Image Gallery Component

**Decision**: Use a lightweight client component with `<Image>` for the gallery.

**Rationale**: Image switching requires client-side interactivity (click thumbnails to change main image). This is the only required `"use client"` boundary on the page — the rest remains server-rendered.

**Implementation**:
- Main image: Large `next/image` with priority loading
- Thumbnails: Small clickable images below the main image
- State management: `useState` for selected image index
- Fallback: Gradient placeholder when no images

## 6. Related Products Strategy

**Decision**: Return up to 4 other products from the same category, excluding the current product.

**Rationale**: The Figma design shows 4 product cards in the "Related Products" section. Since the product detail already resolves the parent category, we can query the same category for other products.

**Implementation**:
- After resolving the current product, call `catalogApi.searchItems({ categoryIds: [parentCategoryId], limit: 5 })`
- Filter out the current product by ID
- Return up to 4 remaining products
- If fewer than 4 exist, show whatever is available (or hide section if empty)
