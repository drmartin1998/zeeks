# Quickstart: Allowlisted Category Filtering

**Date**: 2026-08-01

## Prerequisites

- Square production catalog with Miniatures (ZCZJWQX6WREDLATZFW3U7OCJ) and Hobby Supplies (62G7JSXJDS4U574NW4XS4WKV) categories configured
- `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_APPLICATION_ID` set via Vercel env
- Dev server running: `vercel dev` (or reuse existing on port 3000)
- All existing tests passing: `npm test`

## Validation Scenarios

### 1. Nav Bar Shows Only Allowlisted Categories

```bash
# Open any page and verify nav bar
curl -s http://localhost:3000 | grep -o "Miniatures\|Hobby Supplies\|Board Games\|Card Games\|Supplies"
```

**Expected**: "Miniatures" and "Hobby Supplies" appear. "Board Games", "Card Games", and "Supplies" do NOT appear in the nav.

### 2. Allowlisted Category Pages Load

```bash
# Visit Miniatures page
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/categories/miniatures
# Expected: 200

# Visit Hobby Supplies page
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/categories/hobby-supplies
# Expected: 200
```

### 3. Non-Allowlisted Category Pages Return 404

```bash
# Board Games should 404
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/categories/board-games
# Expected: 404

# Any non-existent category should still 404
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/categories/nonexistent
# Expected: 404
```

### 4. API Endpoint Returns Only Allowlisted Categories

```bash
curl -s http://localhost:3000/api/catalog/categories | python3 -m json.tool
```

**Expected**: JSON array with at most 2 entries. Each entry has `label` and `href` fields. No category other than Miniatures or Hobby Supplies appears.

### 5. Static Links Preserved

```bash
# Verify static nav links are unaffected
curl -s http://localhost:3000 | grep -c "About Us\|Locations\|Sale"
```

**Expected**: All three static links (About Us, Locations, Sale) are present in the page HTML.

### 6. Subcategory Filtering Still Works (Miniatures)

```bash
# Visit a Miniatures page with subcategories
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/categories/miniatures
# Expected: 200 — if Miniatures has subcategories, filter chips should render
```

### 7. All Existing Tests Pass

```bash
npm test
# Expected: All 30+ tests pass, zero failures
```

```bash
npm run test:e2e
# Expected: E2E tests pass (Playwright against local server)
```

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Nav bar shows no Square categories | Square API error or missing categories | Check `vercel dev` logs for Square API errors |
| `/categories/miniatures` returns 404 | Miniatures ID doesn't match Square | Verify ID `ZCZJWQX6WREDLATZFW3U7OCJ` in Square Dashboard |
| Other categories still appear | Filter not applied at correct location | Verify `fetchAllCategories()` has the `ALLOWED_CATEGORY_IDS` filter |
| Tests fail | Test mock data includes non-allowlisted categories | Update test mocks to use allowlisted IDs |
