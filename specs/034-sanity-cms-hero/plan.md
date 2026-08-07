# Implementation Plan: Sanity CMS Hero

**Branch**: `034-sanity-cms-hero` | **Date**: 2026-08-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/034-sanity-cms-hero/spec.md`

## Summary

Replace the hardcoded home page hero (`components/hero-section.tsx`, with a static `bg-image`/hero copy) with a hero driven entirely by the Sanity `heroBlock` on the home page document (slug `/`). The hero badge, heading, subheading, background image (served from the Sanity CDN), and both CTA buttons will be rendered from Sanity data, with graceful degradation when content is missing. The work reuses the existing Sanity infrastructure (`lib/sanity/client.ts`, `lib/sanity/live.ts`, `lib/sanity/queries.ts`) and the existing `heroBlock` content model (see `sanity.types.ts`).

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19, Next.js 16 (App Router)

**Primary Dependencies**: `next-sanity` (`sanityFetch`, `defineQuery`, image rendering), `@sanity/image-url` (for the CSS background image URL from the image asset ref), Tailwind CSS 4 (layout), shadcn/ui (`Button`)

**Storage**: Sanity CMS (`ed5rvr0p` / `production` dataset). Home page document `_type: "page"`, slug `/`, containing `pageBuilder[]` whose first block is `_type: "heroBlock"`.

**Testing**: Vitest (unit + integration via RTL + MSW), Playwright (E2E). Existing `tests/setup/vitest-setup.ts`.

**Target Platform**: Vercel (Node.js serverless)

**Performance Goals**: No significant change — a single additional Sanity query on the home page, cached via `defineLive`/CDN.

**Constraints**: No mock data fallback (Rule 2 / Constitution VII) — on missing content show a neutral/empty hero, never substitute hardcoded copy. `@/*` path imports only (Constitution III). Hero must remain a client leaf where interactivity is needed, but data fetching belongs in the server component (`app/page.tsx`) so no Sanity token reaches the browser (Constitution II).

**Scale/Scope**: 
- `lib/sanity/queries.ts` — add a `HOME_HERO_QUERY`.
- `components/hero-section.tsx` — convert to a presentational component driven by props (still `"use client"` if it keeps interactive concerns, or make it a plain presentational component).
- `app/page.tsx` — fetch the hero block server-side and pass it to `HeroSection`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | PASS | Data fetching via `sanityFetch` in async `app/page.tsx` (server). `HeroSection` stays a leaf; if purely presentational it needs no client directive |
| II | API Route Security | PASS | Sanity fetch happens server-side only; read token (`SANITY_API_READ_TOKEN`) is never exposed to the browser. CDN image URLs are public by design |
| III | Type-Safe Data Flow | PASS | Use the existing `HeroBlock` type from `sanity.types.ts`; type the fetched query result via `sanityFetch` return type or an explicit local interface. `@/*` imports only |
| IV | Component Architecture | PASS | Keep shadcn `Button` and Tailwind utility classes; no new styling framework |
| V | Performance & Caching | PASS | `sanityFetch` uses `defineLive` (cached); CDN image. Reuse is enough for a single hero query |
| VI | Gherkin-First Testing | PASS | `.feature` file exists with 6 scenarios. Add integration test for `Home`/`HeroSection` rendering Sanity fixture (MSW), and build the Sanity asset→URL helper as a pure unit function |
| VII | No Mock Data Fallback | PASS | On missing `heroBlock`/image, render neutral/empty state (no error, no hardcoded copy, no broken image) |

## Project Structure

### Documentation (this feature)

```text
specs/034-sanity-cms-hero/
├── spec.md               # Step 1 output (/speckit-specify)
├── features/
│   └── sanity-cms-hero.feature   # Step 2 output (/speckit-gherkin-sync)
├── plan.md               # This file (step 3)
├── checklists/
│   └── requirements.md   # Step 4 output (/speckit-checklist)
└── tasks.md              # Step 5 output (/speckit-tasks)
```

## Suggested Implementation Strategy (run after this plan is approved)

### Data layer
1. **Add `HOME_HERO_QUERY`** in `lib/sanity/queries.ts` — fetch the first `heroBlock` from the home page document (slug `/`), including `eyebrow`, `heading`, `subheading`, `image`, `primaryCta`, `secondaryCta`. Define once with `defineQuery`.
2. **Image URL helper** — add a small pure function (e.g. in `lib/sanity/image.ts`) that builds a Sanity CDN URL from an image asset `_ref` using `@sanity/image-url` configured with the shared client. Unit-testable.

### Presentation
3. **Refactor `components/hero-section.tsx`** to accept the hero data as props (`eyebrow`, `heading`, `subheading`, `imageUrl`, `primaryCta`, `secondaryCta`) and render conditionally — no content → neutral section; missing/unset CTA → omitted. Keep it presentational.
4. **Wire `app/page.tsx`** — `await sanityFetch({ query: HOME_HERO_QUERY })`, resolve the image URL, and pass the block to `<HeroSection />`. Handle the absent-document case by passing `null`.

### Tests
5. **Unit test** the Sanity asset→CDN URL helper.
6. **Integration test** `Home`/`HeroSection` rendering a Sanity fixture (MSW) — full render (US1) and graceful-missing states (US2).

## Quality Gates (run before merge)

```bash
tsc --noEmit
npm run lint
npm test
# (Playwright E2E if CI requires the critical home journey)
```

Complexity Tracking:
| Complexity | Mitigation |
|-----------|-----------|
| Sanity image `_ref` → CDN URL mapping | Small isolated pure helper + unit test |
| Refactoring `HeroSection` from hardcoded → props | Presentational prop-driven component, no behavior change otherwise |
| Live content updates | Use `sanityFetch` (defineLive) so revalidation is handled by Sanity |
