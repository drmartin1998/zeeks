# Quickstart: Product Search

**Feature**: 012-search-products
**Date**: 2026-08-02

## Prerequisites

- Dev server running on port 3000

## Validation Scenarios

### VS-1: Search from nav bar

1. Type "warhammer" in the nav bar search input
2. Press Enter or click the search button

**Expected**: Browser navigates to `/search?q=warhammer`. Page shows "Search results for 'warhammer'" heading and product grid with matching items.

### VS-2: Empty search results

1. Navigate to `/search?q=xyzzy123`

**Expected**: Page shows "No products found for 'xyzzy123'" message.

### VS-3: Empty query

1. Press Enter in the search bar without typing

**Expected**: No navigation occurs (stays on current page).

### VS-4: Search API

```bash
curl -s 'http://localhost:3000/api/catalog/products/search?q=warhammer' | jq '.products | length'
```

**Expected**: Returns a positive number of products.
