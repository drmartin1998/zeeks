# Tasks: Product Display Page

**Input**: Design documents from `specs/010-product-display-page/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Following the Testing Trophy (Kent C. Dodds). Integration tests for the Route Handler and product detail page; unit tests for type schemas and slug resolution; E2E for navigation flow.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend type definitions and Zod schemas to support product detail data

- [x] T001 Add `ProductVariation` interface and `ProductVariationSchema` Zod schema in `lib/square/types.ts` — fields: id, name, sku?, price, imageUrl?, inventoryCount?
- [x] T002 [P] Add `ProductDetail` interface in `lib/square/types.ts` — extends Product with: slug, images (string[]), variations (ProductVariation[]), category ({ name, slug }), subCategory? ({ name, slug }), inventoryStatus ("IN_STOCK" | "OUT_OF_STOCK" | "UNKNOWN"), categoryPath? (for breadcrumbs)
- [x] T003 [P] Add `ProductDetailSchema` Zod schema in `lib/square/types.ts` — validates ProductDetail shape with all new fields
- [x] T004 [P] Create directory structure for new components: `components/product-detail/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Slug-based product lookup Route Handler that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create `GET /api/catalog/products/slug/[slug]/route.ts` — accepts slug as path param; delegates to `getProductDetailBySlug()`. Returns ProductDetail JSON on match or 404 if not found. (Note: uses `catalogApi.search({ objectTypes: ["ITEM"] })` — NOT `searchItems` — for initial item fetch, as `searchItems` requires additional filters beyond `enabledLocationIds`.)
- [x] T006 Add `getProductDetailBySlug(slug: string)` function in `lib/square/catalog.ts` — encapsulates slug resolution logic (search → match → batchGet → enrich). Returns `Promise<ProductDetail | null>`.
- [x] T007 [P] Unit test for `slugify()` edge cases in `lib/square/__tests__/catalog.test.ts` — test special characters, multiple spaces, leading/trailing dashes, empty strings

**Checkpoint**: Foundation ready — slug-based product lookup works. ProductDetail data can be fetched for any valid product slug.

---

## Phase 3: User Story 1 - Navigate to Product Detail from Anywhere (Priority: P1) 🎯 MVP

**Goal**: Users can click any product name/card on the site and navigate to a dedicated product detail page showing title, price, description, and primary image. Page layout matches Figma design. Invalid slugs return 404.

**Independent Test**: Click a product link on a category page. Verify browser navigates to `/products/[slug]` and displays the product's title, price, description, and image. Navigate to `/products/nonexistent` and verify 404 page.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

- [ ] T008 [P] [US1] Integration test for slug Route Handler in `app/api/catalog/products/slug/__tests__/route.test.ts` — mock Square API returning items; verify GET /api/catalog/products/slug/[valid-slug] returns ProductDetail JSON with title, price, images; verify GET /api/catalog/products/slug/[invalid-slug] returns 404
- [ ] T009 [P] [US1] Integration test for missing product in `app/api/catalog/products/slug/__tests__/route.test.ts` — mock Square API returning empty items array; verify 404 response
- [ ] T010 [P] [US1] Integration test for product detail 404 page in `app/products/__tests__/page.test.tsx` — mock Route Handler returning 404; verify "Product not found" message rendered

### Implementation for User Story 1

- [x] T011 [US1] Create `app/products/[slug]/page.tsx` — async Server Component that calls `getProductDetailBySlug()` directly (NOT via `fetch()` to own API route — Next.js blocks self-referencing fetches during SSR). Renders product title, price, description, and primary image. Calls `notFound()` for null results. Two-column layout (image left, info right) on desktop; stacked on mobile.
- [x] T012 [P] [US1] Create `components/product-detail/product-info.tsx` — Server Component displaying product title, price (formatted as dollars), and description (preserve line breaks). Props: title, price, currency, description.
- [x] T013 [US1] Add product links to `components/product-listing/product-grid.tsx` — wrap each product title in `<Link href={/products/${productSlug}}>` where slug is derived from product title via slugify(). Also add link to product card image.
- [x] T014 [P] [US1] Add product links to `components/product-listing/product-card.tsx` if a separate card component exists; otherwise ensure ProductGrid changes cover all card interactions
- [x] T015 [US1] Verify existing product listing pages (`app/categories/[slug]/page.tsx`, `app/page.tsx`) generate correct `/products/[slug]` links via updated ProductGrid

**Checkpoint**: US1 complete — product detail page loads with core content. Users navigate from any product link to the detail page. 404 for invalid slugs.

---

## Phase 4: User Story 2 - Rich Product Information (Priority: P2)

**Goal**: Product detail page displays multiple images in a gallery, full description formatting, product variations with selection, and out-of-stock indicators.

**Independent Test**: Visit a product with multiple images, variations, and detailed description. Verify image gallery shows all images, variation selection updates price/image, and out-of-stock products show disabled add-to-cart.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

- [ ] T016 [P] [US2] Integration test for image gallery in `components/product-detail/__tests__/product-image-gallery.test.tsx` — render with 3 image URLs; verify main image displayed; click thumbnail; verify main image updates
- [ ] T017 [P] [US2] Integration test for variation selection in `components/product-detail/__tests__/product-variations.test.tsx` — render with 3 variations; select second variation; verify price updates; verify image updates if variation has specific image
- [ ] T018 [P] [US2] Integration test for out-of-stock indicator in `components/product-detail/__tests__/product-info.test.tsx` — render with inventoryStatus "OUT_OF_STOCK"; verify "Out of Stock" badge visible; verify add-to-cart button disabled

### Implementation for User Story 2

- [x] T019 [US2] Create `components/product-detail/product-image-gallery.tsx` — client component (`"use client"`); accepts `images: string[]`. Renders main large image using `next/image` with priority. Below, renders thumbnail strip — clickable small images that set main image via `useState`. If images is empty or single, show single image without thumbnails. Handles image load errors with gradient placeholder.
- [x] T020 [P] [US2] Create `components/product-detail/product-variations.tsx` — client component (`"use client"`); accepts `variations: ProductVariation[]`. Renders a dropdown/select for variation choice. On selection change, calls `onVariationChange(variation)` prop callback. Defaults to first variation.
- [x] T021 [US2] Update `app/products/[slug]/page.tsx` — integrate product-image-gallery and product-variations components. Pass images and variations from ProductDetail data. Wire variation selection to update displayed price and image. Add "Out of Stock" badge and disable add-to-cart when inventoryStatus is OUT_OF_STOCK.
- [x] T022 [US2] Add quantity selector input to `app/products/[slug]/page.tsx` or create `components/product-detail/quantity-selector.tsx` — number input with min:1, increment/decrement buttons. Visual-only in v1 (not wired to cart).

**Checkpoint**: US2 complete — product detail page has full rich content: image gallery, variation selector, out-of-stock handling, quantity input.

---

## Phase 5: User Story 3 - Breadcrumb Navigation & Related Products (Priority: P3)

**Goal**: Product detail page shows breadcrumb trail (Home > Category > [Subcategory] > Product) and related products section.

**Independent Test**: Visit a product in a category with subcategories. Verify breadcrumb shows full hierarchy with clickable links. Verify related products section shows up to 4 products from same category, excluding current product.

### Tests for User Story 3 (MANDATORY — Testing Trophy)

- [ ] T023 [P] [US3] Integration test for breadcrumb rendering in `components/product-detail/__tests__/breadcrumb.test.tsx` — render with category and subcategory; verify "Home > [Category] > [Subcategory] > [Product]" displayed; verify each segment is a clickable link
- [ ] T024 [P] [US3] Integration test for related products in `components/product-detail/__tests__/related-products.test.tsx` — render with 5 related products; verify only 4 displayed; verify current product excluded

### Implementation for User Story 3

- [x] T025 [US3] Create `components/product-detail/breadcrumb.tsx` — Server Component; accepts category ({ name, slug }), subCategory? ({ name, slug }), productTitle. Renders breadcrumb trail: Home > Category > [Subcategory] > Product. Each segment (Home, Category, Subcategory) is a `<Link>`. Product name is plain text (current page).
- [x] T026 [P] [US3] Create `components/product-detail/related-products.tsx` — Server Component; accepts `products: Product[]` (up to 4). Renders a heading "Related Products" and a grid of product cards using existing ProductCard component. If products array is empty, section is hidden.
- [x] T027 [US3] Update `app/products/[slug]/page.tsx` — integrate breadcrumb and related-products components. Pass category/subCategory from ProductDetail data for breadcrumbs. Pass relatedProducts array for the related products section.
- [x] T028 [US3] Add `relatedProducts` resolution logic to `getProductDetailBySlug()` in `lib/square/catalog.ts` — after resolving current product, fetch up to 5 products from the same parent category via `catalogApi.searchItems({ categoryIds: [parentCategoryId], limit: 5 })`; filter out current product by ID; return up to 4.

**Checkpoint**: US3 complete — breadcrumbs provide navigation context. Related products drive discovery.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T029 Run `tsc --noEmit` — fix any type errors
- [x] T030 Run `npm run lint` — fix any lint errors (0 errors required)
- [x] T031 Run `npm test` — all integration and unit tests must pass with zero failures
- [ ] T032 [P] Run `npm run test:e2e` — verify product detail page navigation flow from category page to product detail and back
- [ ] T033 Validate via quickstart.md — run through all 11 validation scenarios and confirm expected outcomes
- [ ] T034 [P] Responsive design check — verify page layout at 1440px (lg), 768px (md), and 375px (sm) matches Figma responsive variants
- [x] T035 Code cleanup — remove any debug logs, unused imports, or commented-out code introduced during implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T003) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) and US1 page component (T011) — extends existing page
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) and US1 page component (T011) — extends existing page
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — independent, delivers MVP
- **User Story 2 (P2)**: Can start after US1 (T011 page exists) — adds rich content to existing page
- **User Story 3 (P3)**: Can start after US1 (T011 page exists) — adds navigation/discovery to existing page

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Implementation tasks follow after all tests for that story are written
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (T001-T004) can run in parallel (different sections of same file or different files)
- All US1 tests (T008-T010) can run in parallel
- T012 (product-info) can run in parallel with T013 (product-grid links)
- All US2 tests (T016-T018) can run in parallel
- T019 (image-gallery) and T020 (variations) can run in parallel
- All US3 tests (T023-T024) can run in parallel
- T025 (breadcrumb) and T026 (related-products) can run in parallel
- T029-T035 (Polish) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tests together:
Task: "Integration test for slug Route Handler in app/api/catalog/products/slug/__tests__/route.test.ts"
Task: "Integration test for missing product in app/api/catalog/products/slug/__tests__/route.test.ts"
Task: "Integration test for product detail 404 page in app/products/__tests__/page.test.tsx"

# After tests written (and failing), launch implementation:
Task: "Create app/products/[slug]/page.tsx"
# These two can run in parallel with the page:
Task: "Create components/product-detail/product-info.tsx"
Task: "Add product links to components/product-listing/product-grid.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup — types and schemas (T001-T004)
2. Complete Phase 2: Foundational — slug Route Handler (T005-T007)
3. Complete Phase 3: User Story 1 — core product detail page (T008-T015)
4. **STOP and VALIDATE**: Test US1 independently — product links work, page loads, 404 handled
5. Deploy/demo if ready — this is a functional product detail page!

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (rich product info)
4. Add User Story 3 → Test independently → Deploy/Demo (navigation & discovery)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (page + product links)
3. Once US1 page exists:
   - Developer A: User Story 2 (image gallery, variations)
   - Developer B: User Story 3 (breadcrumbs, related products)
4. Stories integrate into the same page independently

---

## Notes

- All 35 tasks across 6 phases
- Tests are MANDATORY per Testing Trophy — 10 test tasks (T007-T010, T016-T018, T023-T024)
- Constitution compliance: Server Components (T011), Route Handler (T005), Type-safe (T001-T003), Progressive Enhancement (all `<Link>` use), No mock data (Route Handler fetches live Square API)
- The existing `app/api/catalog/products/[id]/route.ts` (ID-based lookup) is preserved — slug handler is separate
- Add-to-cart button is visual-only in v1 (spec assumption); wires up in future cart feature
- Channel filter is inherited via `fetchAllCategories()` in category resolution — products not in channel return 404
