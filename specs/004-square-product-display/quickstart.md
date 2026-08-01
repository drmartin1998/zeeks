# Quickstart: Square Product Display

## Prerequisites

- Square sandbox with catalog items configured
- SQUARE_ACCESS_TOKEN set in .env.local
- SQUARE_ENVIRONMENT set to "sandbox"
- Dev server: `vercel dev` on port 3000

## Validation Scenarios

### 1. Verify Square API Connectivity

```bash
# Check if Square API returns categories
curl -s http://localhost:3000/api/catalog/categories | jq '. | length'
# Expected: number > 0
```

### 2. Verify Category Page Products

```bash
curl -s http://localhost:3000/categories/board-games | grep -c 'Product'
# Expected: product card content present
```

### 3. Verify No Mock Data

```bash
grep -r "from.*@/lib/data['\"]" app/ components/ --include="*.tsx" --include="*.ts" -l
# Expected: No output (zero mock data imports)
```

### 4. Quality Gates

```bash
tsc --noEmit && npm run lint && npm test
# All must pass
```
