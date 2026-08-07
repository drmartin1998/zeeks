# Implementation Plan: Search Typeahead

**Branch**: `031-search-typeahead` | **Date**: 2026-08-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/031-search-typeahead/spec.md`

## Summary

Replace the existing navigation search bar with a typeahead component (per the Figma `search-typeahead` design) that shows a dropdown of matching product suggestions as the shopper types. Suggestions are fetched from the catalog via a **debounced server-side search** on each pause in typing (clarification Q1). The dropdown shows up to **5 suggestions** (clarification Q2) plus a results count and a "View all results" action that navigates to the existing search results page. The typeahead is integrated **only in the site-navigation search bar** (clarification Q3). It has two design states: results available (with a "PRODUCTS (N results)" header, product rows, and a "View all N results for 'query' →" footer) and empty (with a "No products found for 'query'" message and example alternative searches). The typeahead is a client-side enhancement layered on the existing search bar form, which continues to submit to `/search?q=` on Enter (progressive enhancement).

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19, Next.js 16 (App Router)

**Primary Dependencies**: Square Node.js SDK (`square`), Zod, Tailwind CSS 4, shadcn/ui, Lucide React

**Storage**: N/A — product suggestions come live from the Square catalog via the existing search API

**Testing**: Vitest (unit + integration via RTL + MSW), Playwright (E2E)

**Target Platform**: Vercel (Node.js serverless)

**Project Type**: Next.js web application (App Router)

**Performance Goals**: Suggestions appear within 300ms of the shopper pausing while typing (SC-001); debounced server-side fetch avoids per-keystroke requests

**Constraints**: Only the navigation search bar is in scope (FR-007); the search results page (`/search?q=`) is unchanged (FR-008); suggestions limited to 5 (FR-SC-002); no client-side Square API calls; whitespace-only queries trigger nothing (FR-011)

**Scale/Scope**: ~230 products in the catalog; 1 new/updated client component (typeahead) replacing the nav search bar; reuses the existing search API route; 1 integration point (nav-bar)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | PASS | Data fetching for suggestions happens server-side via the existing search Route Handler; the typeahead is a client leaf node requiring interactivity (debounced typing, dropdown state, keyboard nav) |
| II | API Route Security | PASS | Suggestions fetched through the existing `/api/catalog/products/search` Route Handler; Square token never exposed to browser; Zod validates query params |
| III | Type-Safe Data Flow | PASS | Reuses `Product` / `DisplayProduct` types and `ProductSearchParamsSchema` in `lib/square/types.ts`; `@/*` imports throughout |
| IV | Vercel-Native Performance | PASS | Debounced server-side fetch limits request volume; dropdown is lightweight; no layout shift (SC-005) |
| V | Progressive Enhancement | PASS | The search bar form still submits to `/search?q=` on Enter without JS; the typeahead dropdown layers on top of the baseline input |
| VI | Gherkin-First Testing | PASS | `.feature` file exists with 9 scenarios across 4 user stories. Integration tests for the typeahead component (debounce, suggestions, empty state, keyboard nav); E2E for the nav search journey |
| VII | Environment-Driven Configuration | PASS | No new config values; reuses `SQUARE_*` env vars validated in `lib/env.ts` |

## Project Structure

### Documentation (this feature)

```text
specs/031-search-typeahead/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
├── features/
│   └── search-typeahead.feature
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
components/
├── search-typeahead/                 # NEW: typeahead component directory
│   ├── search-typeahead.tsx          # NEW: main typeahead (debounced input + dropdown)
│   ├── suggestion-list.tsx           # NEW: dropdown results panel (header, rows, footer)
│   ├── suggestion-row.tsx            # NEW: single product suggestion row
│   ├── empty-state.tsx               # NEW: "no products found" empty panel
│   └── __tests__/
│       └── search-typeahead.test.tsx # NEW: integration tests (debounce, suggestions, empty, keyboard)
├── nav-bar.tsx                       # MODIFY: replace inline search form with <SearchTypeahead/>
app/api/catalog/products/search/
└── route.ts                          # MODIFY: support a `limit` param (e.g., limit=5) for suggestions if needed
```

**Structure Decision**: Next.js App Router. A new client component `SearchTypeahead` (in `components/search-typeahead/`) replaces the inline search form in the nav bar. It debounces the query, fetches suggestions from the existing `/api/catalog/products/search` Route Handler, and renders the Figma dropdown (results or empty state). The search route may gain an optional `limit` query param to cap suggestions at 5.

## Research (Phase 0)

Resolved in [research.md](./research.md). Key decisions:
- **Debounced server-side fetch**: reuse the existing `/api/catalog/products/search?q=` Route Handler; debounce typing (e.g., ~250-300ms) before firing the request to meet SC-001.
- **Suggestion cap**: limit results to 5 for the dropdown; "View all results" links to `/search?q=<query>`.
- **Progressive enhancement**: the search bar form remains; the typeahead enhances the input with a dropdown.

## Complexity Tracking

No constitution violations. All seven principles pass without exception.