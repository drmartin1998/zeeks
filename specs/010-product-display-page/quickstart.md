# Quickstart: Product Display Page

**Feature**: 010-product-display-page
**Date**: 2026-08-02

## Prerequisites

- [x] Dev server running (`vercel dev` on port 3000; check `lsof -ti:3000` first)
- [x] `.env.local` configured with `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_CHANNEL_ID`
- [x] Square catalog has products with names, prices, descriptions, and images
- [x] TypeScript compiles cleanly: `tsc --noEmit`
- [x] Lint passes: `npm run lint`

## Validation Scenarios

### VS-1: Route Handler returns product by slug

```bash
# Fetch a known product slug (replace with actual product from your catalog)
curl -s http://localhost:3000/api/catalog/products/slug/space-marines | jq .
```

**Expected**: JSON response with `id`, `title`, `slug`, `description`, `price`, `images[]`, `variations[]`, `category`, `inventoryStatus`, `relatedProducts[]`.

### VS-2: Route Handler returns 404 for unknown slug

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/catalog/products/slug/nonexistent-product
```

**Expected**: HTTP 404.

### VS-3: Product detail page loads for valid slug

1. Navigate to `http://localhost:3000/products/[valid-slug]` (replace with a real product slug from your catalog)
2. **Expected**: Page displays product image gallery, title, price, description, variations (if any), breadcrumb navigation, and related products section.
3. **Expected**: Layout matches the Figma `product-detail-page` design.

### VS-4: Product links navigate correctly from category page

1. Navigate to a category page (e.g., `/categories/miniatures`)
2. Click any product name or card
3. **Expected**: Browser navigates to `/products/[slug]` for that product
4. **Expected**: Product detail page loads with correct product data

### VS-5: Breadcrumb navigation works

1. Navigate to a product detail page
2. Click "Home" in the breadcrumb
3. **Expected**: Navigates to homepage
4. Click the category name in the breadcrumb
5. **Expected**: Navigates to that category's listing page

### VS-6: Image gallery interaction

1. Navigate to a product with multiple images
2. **Expected**: First image displayed as main image; thumbnails shown below
3. Click a thumbnail
4. **Expected**: Main image updates to the selected thumbnail

### VS-7: Variation selection updates display

1. Navigate to a product with variations (e.g., sizes)
2. Select a different variation from the dropdown
3. **Expected**: Price updates to the variation's price; image updates if variation has specific image

### VS-8: Out of stock indicator

1. Navigate to a product that is out of stock (or mock OOS in test)
2. **Expected**: "Out of Stock" badge displayed; add-to-cart button disabled

### VS-9: 404 page for invalid slug

1. Navigate to `http://localhost:3000/products/invalid-product-xyz`
2. **Expected**: "Product not found" message displayed

### VS-10: Related products section

1. Navigate to a product detail page for a product in a category with multiple items
2. **Expected**: "Related Products" section displays up to 4 product cards from the same category
3. **Expected**: Current product is not included

### VS-11: Direct URL navigation works

1. Copy a product detail page URL (e.g., `/products/space-marines`)
2. Open a new browser tab and paste the URL
3. **Expected**: Page loads correctly without requiring prior navigation through the site

## Files Changed

| File | Change |
|------|--------|
| `app/products/[slug]/page.tsx` | **NEW** — Product detail page Server Component |
| `app/api/catalog/products/slug/[slug]/route.ts` | **NEW** — Slug-based product lookup Route Handler |
| `lib/square/types.ts` | **MODIFY** — Add `ProductDetail`, `ProductVariation` types + Zod schemas |
| `lib/square/catalog.ts` | **MODIFY** — Add `getProductDetailBySlug()` |
| `lib/square/__tests__/catalog.test.ts` | **MODIFY** — Add slug lookup tests |
| `components/product-detail/*.tsx` | **NEW** — Image gallery, product info, variations, related products |
| `components/product-listing/product-grid.tsx` | **MODIFY** — Add `<Link>` to product titles |
| `components/product-listing/product-card.tsx` | **MODIFY** — Wrap product name in `<Link>` |

## Test Commands

```bash
# Unit + Integration tests
npx vitest run

# Type check
tsc --noEmit

# Lint
npm run lint

# E2E (requires dev server with SQUARE_CHANNEL_ID)
npm run test:e2e
```
