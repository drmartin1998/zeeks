# Contracts: Homepage Local Store Hub

**Feature**: 035-local-store-hub
**Date**: 2026-08-07

## Component Contract

### `EventCardProps`

The props accepted by the `EventCard` component (and the shape of each item in the events data array).

```ts
interface EventCardProps {
  id: string;
  category: string;     // badge label, rendered uppercase in accent color
  dateTime: string;     // e.g. "Fri • 6:00 PM", rendered in accent orange
  title: string;        // bold, dark
  description: string;  // muted
}
```

### `LocalStoreHub`

The homepage section. Renders the header (heading, subtitle, "VIEW ALL EVENTS" link to `/events`) and a grid of event cards. Presentational / server component; no props required (reads from `events-data.ts`).

**Behavior**:
- Renders four `EventCard`s from the static events data.
- If the events array is empty, renders the header + link and an empty/neutral card area (no malformed cards).
- Cards are display-only (no per-card anchor).

## Route Contract

### `GET /events`

A placeholder events listing page so the "VIEW ALL EVENTS" link does not 404.

- **Purpose**: Placeholder destination for the homepage's "VIEW ALL EVENTS" link.
- **Response**: A minimal, styled page (e.g. heading + note that the full event calendar is coming soon).
- **Status**: Always 200 (no 404).

## Type-Safety Notes

- `Event` data is typed via the `EventCardProps`/`Event` interface; `@/*` path imports only.
- No Zod schema needed (no external input; static data).