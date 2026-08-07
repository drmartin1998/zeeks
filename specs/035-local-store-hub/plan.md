# Implementation Plan: Homepage Local Store Hub

**Branch**: `035-local-store-hub` | **Date**: 2026-08-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/035-local-store-hub/spec.md`

## Summary

Add the "Local Store Hub" section to the homepage, matching the Figma design (`local-store-hub`, frame `115:1769`). The section renders a header ("Local Store Hub" + subtitle + "VIEW ALL EVENTS" arrow link) and a grid of four display-only `event-card`s (category badge, date/time, bold title, muted description). It sits between the New Arrivals grid (`FeaturedGames`) and the Rewards promo banner (`PromoBanner`) in `app/page.tsx`. Event content is static per the clarified decision; the "VIEW ALL EVENTS" link points to a placeholder events route that does not 404.

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19, Next.js 16 (App Router)

**Primary Dependencies**: Tailwind CSS 4 (layout/styling), Lucide React (`ArrowRight` for the header link), Next.js `next/link` (`Link`), existing home font tokens (`--font-heading` = Outfit, `--font-sans` = Inter/Rubik)

**Storage**: N/A — event content is static/component-level data for this scope (no Sanity schema, no backend)

**Testing**: Vitest (unit + integration via RTL). Existing `tests/setup/vitest-setup.ts`. Tests co-located in `__tests__/`.

**Target Platform**: Vercel (Node.js serverless)

**Project Type**: Next.js web application (App Router)

**Performance Goals**: No significant change — one static server-rendered section on the homepage; no new data fetching

**Constraints**: Match the Figma design (colors: section bg `#F5F3FF`, card border `#CDCDD8`, category badge `#F5A623`, accent orange `#E89516`, title `#0E0E2C`, description `#9090A8`). Cards are display-only (no per-card link). Four cards. "VIEW ALL EVENTS" points to a placeholder events route that must not 404. Responsive: cards in a row on large screens, stack vertically on small screens.

**Scale/Scope**: 1 new component (`components/local-store-hub/`), 1 optional placeholder route (`app/events/`), 1 small data module for the static events, wiring in `app/page.tsx`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | PASS | The `LocalStoreHub` section is a server component (no `"use client"`) — purely presentational, no hooks/browser APIs |
| II | API Route Security | PASS | No external API or token involved; static content only |
| III | Type-Safe Data Flow | PASS | Event data typed via an explicit interface; `@/*` imports only |
| IV | Vercel-Native Performance / Component Architecture | PASS | Uses Tailwind utilities, `Link`, Lucide icons; `cn()` for merging; no new styling framework |
| V | Progressive Enhancement | PASS | Section is server-rendered HTML; link uses `<Link>` producing a real `<a href>` |
| VI | Gherkin-First Testing | PASS | `.feature` file exists with 8 scenarios; add component integration test for the section |
| VII | No Mock Data Fallback | PASS (with note) | Events are declared static content per the clarified product decision (own the assumption in Complexity Tracking); the section degrades gracefully (empty list → neutral grid/header only) |

## Project Structure

### Documentation (this feature)

```text
specs/035-local-store-hub/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
components/
├── ui/
│   └── button.tsx        # existing (buttonVariants — not required for cards)
├── local-store-hub/
│   ├── local-store-hub.tsx   # Section container (header + events grid)
│   ├── event-card.tsx        # Single event card (display-only)
│   ├── events-data.ts        # Static event content (typed)
│   └── __tests__/
│       └── local-store-hub.test.tsx  # Integration test (RTL)
app/
├── page.tsx             # add <LocalStoreHub /> between FeaturedGames and PromoBanner
└── events/              # Placeholder events route (returns a simple page, does not 404)
    └── page.tsx
```

**Structure Decision**: Single Next.js project (App Router). The section is composed of a container (`local-store-hub.tsx`) + a display-only `event-card.tsx`, with static data in `events-data.ts`. This mirrors the existing `components/featured-games.tsx` + `game-card.tsx` pattern.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Static event content in production (Constitution VII "No Mock Data" nuance) | The clarified product decision explicitly chose static/hardcoded event content for this iteration; the design provides the example events and there is no events data source yet | Rendering no events (empty section) contradicts the "add the designed section to the homepage" request; a Sanity `/event` schema is out of scope for this iteration and deferred to a future feature |