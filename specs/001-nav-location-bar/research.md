# Research: Navigation Location Bar

**Feature**: Navigation Location Bar
**Date**: 2026-08-03

## Research Tasks

### 1. How to fetch location data from Square

**Decision**: Use `client.locations.get({ locationId })` from the Square Node.js SDK v45.

**Rationale**: The SDK's `locations.get()` returns a `Location` object with:
- `location.address.locality` — city name
- `location.address.administrativeDistrictLevel1` — state/region abbreviation
- `location.businessHours.periods[]` — array of `{ dayOfWeek, startLocalTime, endLocalTime }`
- `location.timezone` — timezone string (e.g., "America/Los_Angeles")

The `locationId` is already available via `env.SQUARE_LOCATION_ID` and exported from `lib/square/client.ts`. No additional API configuration needed.

**Alternatives considered**:
- REST API directly — rejected; the SDK provides typed responses and is already in use
- GraphQL — not supported by Square for locations
- Environment variable for city/hours — rejected; violates FR-04 (must be live data)

### 2. How to compute "Open Now / Closing Soon / Closed Now" status

**Decision**: Pure function on the server using the store's timezone from Square.

**Rationale**: Since the status only updates on page navigation (no live polling per clarification), computation can happen in the server component. The function:
1. Reads `businessHours.periods[]` from the Square location response
2. Finds the period matching today's day of week (in the store's timezone)
3. Compares current time (in store's timezone) against `startLocalTime` and `endLocalTime`
4. Returns `"open"` | `"closing-soon"` (within 30 minutes of close) | `"closed"` | `"closed-today"` (no hours defined)

Edge cases handled:
- Midnight-spanning hours: if `endLocalTime < startLocalTime`, treat end as next day and check accordingly
- No hours for today: return `"closed-today"`, display "Closed today"
- Timezone: must use `location.timezone` (not server/UTC) for day-of-week and current-time calculation

**Alternatives considered**:
- Client-side computation with `setInterval` polling — rejected; unnecessary for page-load-only updates
- Using a date library (date-fns, luxon) — rejected; adds dependency for a simple computation; `Intl.DateTimeFormat` and native `Date` suffice

### 3. Server-vs-client timezone handling

**Decision**: All time computations happen server-side using `Intl.DateTimeFormat` with the store's timezone. The rendered output is static text (e.g., "Open today: 9 AM – 9 PM") — no client-side time logic.

**Rationale**: Keeps the component simple. Since status only updates on page load, server-side computation is sufficient. The store's timezone from Square is authoritative.

**Alternatives considered**:
- Client-side `Intl` with `timeZone` option — works but adds unnecessary complexity
- UTC conversion — error-prone for DST boundaries; store timezone is the correct reference

### 4. Data fetching pattern (parallel vs sequential)

**Decision**: Fetch location data in parallel with existing category and cart fetches in `NavBarServer`. Use `Promise.allSettled()` so a location fetch failure doesn't block category/cart rendering.

**Rationale**: Follows the existing pattern where `getNavCategories()` has its own try/catch and returns fallback data. Location data should be independent — if it fails, the nav bar hides the location bar but still shows categories and cart.

```typescript
// Pattern in NavBarServer:
const [categories, locationData] = await Promise.allSettled([
  getNavCategories(),
  getLocationBarData(),
]);
```

**Alternatives considered**:
- Sequential await — rejected; adds unnecessary latency
- Single combined fetch — rejected; data comes from different Square API endpoints

### 5. Gherkin scenario mapping

**Decision**: Map spec acceptance scenarios to `.feature` file with `@US1`, `@US2`, `@US3` tags.

**Rationale**: Each user story in the spec maps to one or more Gherkin scenarios. The `.feature` file will be created by `/speckit.gherkin-sync` based on the spec's acceptance scenarios.

## Resolved Technical Questions

| Original Unknown | Resolution |
|-----------------|------------|
| Square Locations API shape | `locations.get()` returns `{ address: { locality, administrativeDistrictLevel1 }, businessHours: { periods[] }, timezone }` |
| Open-status computation | Server-side pure function using store timezone + `Intl.DateTimeFormat` |
| Failure recovery | `Promise.allSettled()` — location failure hides bar, other nav content unaffected |
| Timezone source | `location.timezone` from Square Locations API response |
