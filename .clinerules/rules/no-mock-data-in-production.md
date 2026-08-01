# No Mock Data in Production

Mock/hardcoded data MUST NEVER be used as a fallback on the live running site.
Mock data is ONLY permitted in test files (`*.test.*`, `__tests__/`) and test
utilities (MSW handlers, test setup).

## What Counts as Mock Data

- Hardcoded product arrays (e.g., `const PRODUCTS = [...]`)
- Hardcoded category lists (e.g., `const CATEGORIES = [...]`)
- Hardcoded navigation items that mirror real Square-managed entities
- Any `FALLBACK_*` constants that duplicate production data structures
- Synchronous in-memory lookups that replace API calls

## What Does NOT Count as Mock Data

- Application constants that are not data (e.g., filter option labels, sort choices)
- Static navigation links that are NOT Square-managed (e.g., "About Us", "Locations")
- UI configuration (e.g., color tokens, layout values)
- `STATIC_NAV_CATEGORIES` — these are informational page links, not catalog data

## Enforcement

1. **Production code paths** (pages, server components, data-fetching functions)
   MUST pull data from Square or other live APIs. No hardcoded fallback.

2. **On API failure**: show appropriate error states (404, error page, empty state
   with a message) — never silently substitute mock data.

3. **Test files only**: `lib/data.ts`, `lib/data/products.ts`, and similar
   mock-data modules may be imported EXCLUSIVELY by test files
   (`**/*.test.*`, `**/__tests__/**`). Any non-test import is a violation.

4. **Before merging**: CI must verify no production code imports mock data modules.
