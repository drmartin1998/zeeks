# Quickstart: Subcategory Browsing & Filtering

## Prerequisites

- Square sandbox with categories configured (top-level + subcategories)
- Items assigned to both parent and subcategory IDs
- Dev server running: `vercel dev` (or reuse existing on port 3000)

## Validation Scenarios

### 1. Category Page Shows All Products (Parent + Subcategories)

```bash
# Visit a category page
curl -s http://localhost:3000/categories/board-games | grep -o 'Catan\|Ticket to Ride\|Pandemic' | sort -u
# Expected: Product names from Board Games AND Strategy/Family subcategories
```

### 2. Subcategory Filter Chips Render

```bash
curl -s http://localhost:3000/categories/board-games | grep -oP '(All|Strategy|Family|Cooperative|Abstract)' | sort -u
# Expected: "All" plus subcategory names that exist in Square
```

### 3. No Mock Data Fallback (Square Unreachable)

```bash
# Simulate Square API downtime by setting invalid token temporarily
# Or verify that imports from @/lib/data don't exist in production files
grep -r "from.*@/lib/data['\"]" --include="*.tsx" --include="*.ts" -l \
  | grep -v "__tests__" | grep -v ".test." | grep -v "lib/data.ts"
# Expected: No output (zero production imports of mock data modules)
```

### 4. Pagination Works (>100 Items)

```bash
# Count unique products on a large category
curl -s http://localhost:3000/categories/miniatures | grep -oP 'data-title' | wc -l
# Expected: Should match the total item count in Square for Miniatures + subcategories
# (not truncated at 100)
```

### 5. NavBar Shows Only Static Links When Square Fails

```bash
# When Square is unreachable, NavBar should only show static links
curl -s http://localhost:3000 | grep -oP 'About Us|Locations|Sale'
# Expected: Only these three labels (no Square product categories)
```

### 6. URL Filter State Persistence

```bash
# Visit filtered URL directly
curl -s "http://localhost:3000/categories/board-games?sub=strategy" | grep -o 'Strategy'
# Expected: "Strategy" chip is active in rendered HTML
```

### 7. Filter Zero-Results + Show All

```bash
# Apply a filter that has no products (test with a subcategory slug that exists but has no items)
# Expected UI: "No products in this subcategory" text visible
# Expected UI: "Show all" button visible, clicking returns to unfiltered view
```

### 8. Pagination on categories/[slug]

```bash
# Verify pagination controls appear when >12 products after filtering
# Visit a category with 20+ products
curl -s http://localhost:3000/categories/board-games | grep -c 'Page'
# Expected: pagination controls present when product count > 12
```

## Quality Gates

```bash
tsc --noEmit          # Must pass
npm run lint          # 0 errors
npm test              # All vitest suites pass
npm run test:e2e      # Critical paths pass
```
