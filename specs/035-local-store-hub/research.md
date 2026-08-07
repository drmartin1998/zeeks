# Research: Homepage Local Store Hub

**Feature**: 035-local-store-hub
**Date**: 2026-08-07

## 1. Data Source for the Event Content

- **Decision**: Static, typed event content defined in a local data module (`events-data.ts`), rendered directly by the component.
- **Rationale**: The clarified product decision explicitly chose static/hardcoded event content for this iteration. The Figma design provides the example events (categories, dates/times, titles, descriptions), and there is no events data source or Sanity `/event` schema yet. This keeps scope minimal and ships the designed section.
- **Alternatives considered**:
  - *Sanity CMS* (an `/event` schema + GROQ query, mirroring the hero): more future-proof and rule-aligned, but adds a new schema + content setup that is out of scope for this iteration; deferred.
  - *Rendering no events / empty section*: contradicts the request to "add the designed section to the homepage."
- **Note**: This is a declared deviation from Constitution VII (recorded in plan.md Complexity Tracking) and is owned as an explicit product decision, not a silent fallback.

## 2. Component Architecture Pattern

- **Decision**: Compose the section as a container (`local-store-hub.tsx`) + a display-only `event-card.tsx`, with data in `events-data.ts`. Use `Link` for the header "VIEW ALL EVENTS" link and `ArrowRight` from Lucide for the arrow.
- **Rationale**: Mirrors the existing `components/featured-games.tsx` + `game-card.tsx` pattern already used on the homepage; keeps a clear separation between section logic and per-card presentation.
- **Alternatives considered**: A single large file — rejected for poor modularity and testability; recreating a Figma `event-card` component inline in the section.

## 3. Positioning on the Homepage

- **Decision**: Render `LocalStoreHub` between `<FeaturedGames />` and `<PromoBanner />` in `app/page.tsx`, matching the design order (hero → featured-categories → new-arrivals → local-store-hub → promo-banner → footer).
- **Rationale**: This matches the Figma homepage layout exactly.
- **Alternatives considered**: Placing it elsewhere on the page — rejected, as the design is explicit.

## 4. "VIEW ALL EVENTS" Destination

- **Decision**: Point the link at a placeholder events route (`/events`) that returns a simple page and does not 404.
- **Rationale**: Matches the clarified decision and the design's "View All Events" CTA without a dead link.
- **Alternatives considered**: Omitting the link (rejected — design includes it); linking to an existing store/locations route (rejected — semantically wrong for events).

## 5. Responsive Behavior & Breakpoints

- **Decision**: Cards display in a row on desktop (grid) and stack vertically on small screens, following existing homepage layout conventions (`max-w-[1440px]`, `px-4 md:px-8 lg:px-20`, `py-12 lg:py-20`).
- **Rationale**: Matches the design's 4-up row and the clarify decision; consistent with the homepage's responsive patterns.
- **Alternatives considered**: Fixed-width cards with horizontal scroll — rejected; less mobile-friendly.

## 6. Testing Strategy

- **Decision**: Integration test (RTL) for the `LocalStoreHub` section — renders header, four event cards with category badge/date-time/title/description, and the "VIEW ALL EVENTS" link; plus responsive/empty-list edge cases.
- **Rationale**: Aligns with the Testing Trophy (integration is the largest investment) and the project's co-located `__tests__/` convention.
- **Alternatives considered**: Static-only lint/tsc — insufficient behavioral coverage for acceptance criteria.
