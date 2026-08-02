# Quickstart: SDK-Only Product Fetching

**Feature**: 007-sdk-product-fetching
**Date**: 2026-08-01

## Prerequisites

1. **Square Sandbox credentials** configured in `.env.local`:
   ```bash
   vercel env pull  # Pull from Vercel
   # Or manually set:
   # square_access_token=<sandbox-token>
   # square_location_id=<location-id>
   # square_application_id=<app-id>
   ```

2. **Square Sandbox catalog** has at least one category and one product.

3. **All quality gates pass**:
   ```bash
   tsc --noEmit          # Must pass
   npm run lint          # Must pass (0 errors)
   ```

## Validation Scenarios

### Scenario 1: Browse Home Page (US1)

**Given** the Square SDK is configured with valid sandbox credentials
**When** a customer loads the homepage
**Then** all displayed products should match the live Square sandbox catalog

**Test commands**:
```bash
# Start the dev server (if not already running)
vercel dev

# Verify the homepage renders SDK data
curl -s http://localhost:3000 | grep -o 'Leviathan\|Miniatures' | head -5
```

**Expected**: Real Square product names appear in the HTML (not mock data like "Catan", "Ticket to Ride").

### Scenario 2: Category Product Listing (US1)

**Given** a category exists in Square with products
**When** navigating to `/categories/{slug}`
**Then** displayed products match Square sandbox for that category

**Test commands**:
```bash
# Verify a category page renders
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/categories/miniatures
# Expected: 200
```

### Scenario 3: Error State on Invalid Config (US2)

**Given** Square credentials are invalid
**When** loading any product page
**Then** an error message is displayed, not mock data

**Test commands**:
```bash
# Temporarily use invalid token (sandbox mode — safe)
SQUARE_ACCESS_TOKEN=invalid vercel dev
# Navigate to homepage — expect error banner, not mock products
```

**Expected**: Error state rendered; zero instances of `@/lib/data` mock products.

### Scenario 4: API Contract Validation

```bash
# Category listing
curl -s http://localhost:3000/api/catalog/categories | jq '.[0].label'

# Product listing by slug
curl -s 'http://localhost:3000/api/catalog/products?slug=miniatures' | jq '.products[0].title'

# Product search
curl -s 'http://localhost:3000/api/catalog/products/search?q=warhammer' | jq '.products | length'

# Product detail
curl -s http://localhost:3000/api/catalog/products/ITEM_ID | jq '.title'
```

## Test Suite

### Unit & Integration Tests

```bash
npm test
# Must pass with zero failures
```

Key test areas:
- Zod schema validation (unit)
- Route Handler responses (integration with MSW)
- Retry logic utility (unit)
- Server Component rendering with MSW-mocked Route Handlers (integration)

### E2E Tests

```bash
npm run test:e2e
# Must pass against sandbox catalog
```

## Mock Data Verification

```bash
# Verify zero production imports from mock data
grep -r "from.*@/lib/data[^/]" app/ && echo "FAIL: Mock data imported in app/" || echo "PASS"
grep -r "from.*@/lib/data/products" app/ && echo "FAIL: Mock products imported in app/" || echo "PASS"
grep -r "FALLBACK_" app/ lib/ && echo "FAIL: FALLBACK_ constants in production" || echo "PASS"
```

All three checks MUST pass (no output before "PASS").

## Rollback Plan

If Square API issues occur in production:
1. The error state banner informs users (no mock fallback)
2. Static pages (About, Locations) remain unaffected
3. Vercel instant rollback to previous deployment is available
