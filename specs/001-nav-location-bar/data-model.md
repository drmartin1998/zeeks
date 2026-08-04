# Data Model: Navigation Location Bar

**Feature**: Navigation Location Bar
**Date**: 2026-08-03

## Entities

### StoreLocation

Represents the display-relevant subset of a Square Location used by the navigation bar.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `city` | `string` | `location.address.locality` | City name (e.g., "Seattle") |
| `state` | `string` | `location.address.administrativeDistrictLevel1` | State/region code (e.g., "WA") |
| `timezone` | `string` | `location.timezone` | IANA timezone (e.g., "America/Los_Angeles") |

**Validation**: Zod schema ensures non-empty strings for city and state.

### BusinessHours

A single day's operating period from Square's `businessHours.periods[]`.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `dayOfWeek` | `"MON" \| "TUE" \| ... \| "SUN"` | `period.dayOfWeek` | Day of the week |
| `startLocalTime` | `string` | `period.startLocalTime` | Opening time in `HH:mm` format (store local) |
| `endLocalTime` | `string` | `period.endLocalTime` | Closing time in `HH:mm` format (store local) |

### OpenStatus

Computed display state — not stored, derived from BusinessHours + current time.

| Value | Condition |
|-------|-----------|
| `"open"` | Current time >= opening AND < (closing - 30 min) |
| `"closing-soon"` | Current time >= (closing - 30 min) AND < closing |
| `"closed"` | Current time < opening OR current time >= closing |
| `"closed-today"` | No hours period defined for today |

### LocationBarData (display props)

Aggregate passed from server to client component.

| Field | Type | Description |
|-------|------|-------------|
| `cityState` | `string` | Formatted "City, ST" (e.g., "Seattle, WA") |
| `hoursDisplay` | `string` | Formatted hours text (e.g., "Open today: 9 AM – 9 PM") |
| `status` | `"open" \| "closing-soon" \| "closed" \| "closed-today"` | Current open status |
| `statusText` | `string` | Human-readable status (e.g., "Open Now", "Closing Soon") |

### TypeScript Types

```typescript
// lib/square/types.ts — NEW types

export interface SquareLocationHours {
  dayOfWeek: string;
  startLocalTime: string;
  endLocalTime: string;
}

export interface LocationBarData {
  cityState: string;
  hoursDisplay: string;
  status: "open" | "closing-soon" | "closed" | "closed-today";
  statusText: string;
}

// Zod schemas for validation
export const LocationBarDataSchema = z.object({
  cityState: z.string().min(1),
  hoursDisplay: z.string().min(1),
  status: z.enum(["open", "closing-soon", "closed", "closed-today"]),
  statusText: z.string().min(1),
});
```

## State Transitions

```
[Page Load] → fetchLocation() → getLocationBarData()
                                    │
                          ┌─────────┴─────────┐
                          │ Square API success  │ Square API failure
                          ▼                     ▼
                   computeStatus()        return null
                          │               (bar hidden per FR-06)
                   ┌──────┼──────┐
                   ▼      ▼      ▼
                 open  closing closed / closed-today
                        -soon
```

The status is computed fresh on every page load. No caching or client-side polling needed.

## Relationships

- **LocationBarData** is derived from **StoreLocation** + **BusinessHours[]** + current time
- No database persistence — data flows: Square API → `NavBarServer` → `LocationBar` (client component)
- Data is independent of categories, cart, and auth — fetched in parallel with `Promise.allSettled()`
