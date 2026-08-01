# Implementation Plan: Square Product Display

**Branch**: `004-square-product-display` | **Date**: 2026-08-01 | **Spec**: [spec.md](./spec.md)

## Summary

Diagnose and fix products not displaying from Square. Infrastructure exists in `lib/square/catalog.ts` — this is verification and debugging to find root cause.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 16.2
**Primary Dependencies**: React 19, Square SDK 45.x, Tailwind CSS 4
**Testing**: Vitest + @testing-library/react
**Target Platform**: Vercel (serverless)
**Constraints**: All data from Square; zero mock data
**Scale/Scope**: Bug fix — investigation + verification of existing pipeline

## Constitution Check

| Principle | Status |
|-----------|--------|
| I. Server Components First | ✅ |
| II. API Route Security | ✅ |
| III. Type-Safe Data Flow | ✅ |
| IV. Component Architecture | ✅ |
| V. Performance & Caching | ✅ |
| VI. Gherkin-First Testing | ✅ |
| VII. No Mock Data Fallback | ✅ |

## Project Structure

```text
lib/square/catalog.ts          # getSquareProductsByCategorySlug, getSquareCategories
components/category-product-grid.tsx  # Product rendering
components/game-card.tsx              # Product card
app/categories/[slug]/page.tsx # Category page
app/page.tsx                   # Homepage
```

## Complexity Tracking

No violations. Bug fix on existing infrastructure.
