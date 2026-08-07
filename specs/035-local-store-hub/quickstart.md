# Quickstart: Homepage Local Store Hub

**Feature**: 035-local-store-hub
**Date**: 2026-08-07

## Prerequisites

- [ ] Dev server running (`vercel dev` on port 3000; check `lsof -ti:3000` first, reuse if already running)
- [ ] TypeScript compiles cleanly: `tsc --noEmit`
- [ ] Lint passes: `npm run lint`
- [ ] Tests pass: `npm test`

## Validation Scenarios

### VS-1: The Local Store Hub section renders on the homepage

1. Navigate to `http://localhost:3000/`.
2. Scroll past the New Arrivals grid.
3. **Expected**: A "Local Store Hub" section appears between New Arrivals and the Rewards promo banner, with the heading "Local Store Hub", the subtitle "Upcoming events, tournaments, and community nights at your local Zeeks store.", and a "VIEW ALL EVENTS" link with an arrow.

### VS-2: Event cards render the designed content

1. In the Local Store Hub section, inspect the four event cards.
2. **Expected**: Each card shows a category badge (accent color, white uppercase text), an orange date/time, a bold title, and a muted description — matching the design.

### VS-3: Section is responsive

1. Resize the browser to a mobile width (e.g. 375px).
2. **Expected**: The four event cards stack vertically and remain readable; no horizontal overflow.

### VS-4: "VIEW ALL EVENTS" link navigates

1. Click "VIEW ALL EVENTS".
2. **Expected**: You navigate to `/events` (a placeholder events page) and do not get a 404.

### VS-5 (automated): Component integration test

1. Run `npm test` (the `local-store-hub` test within `components/local-store-hub/__tests__/`).
2. **Expected**: Test asserts the section renders the header, four cards (badge/date-time/title/description), and the "VIEW ALL EVENTS" link to `/events`.

## Reference

- Data model: [data-model.md](./data-model.md)
- Component/route contracts: [contracts/events.md](./contracts/events.md)
- Acceptance criteria: [features/local-store-hub.feature](./features/local-store-hub.feature)