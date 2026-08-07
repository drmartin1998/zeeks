# Data Model: Homepage Local Store Hub

**Feature**: 035-local-store-hub
**Date**: 2026-08-07

## Entities

### 1. Event

A single in-store community activity shown as a card in the Local Store Hub section. Static, display-only content for this iteration.

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | `string` | `"friday-night-magic"` | Stable key for the card |
| `category` | `string` | `"Weekly"` | Badge label (uppercase, accent color) |
| `dateTime` | `string` | `"Fri • 6:00 PM"` | Date/time display text (accent orange) |
| `title` | `string` | `"Friday Night Magic"` | Event title (bold, dark) |
| `description` | `string` | `"Join our weekly Magic: The Gathering tournament..."` | Short description (muted) |

**Source**: `components/local-store-hub/events-data.ts` (static array).

### 2. Local Store Hub Section

The homepage section container.

| Aspect | Value |
|--------|-------|
| Section background | `#F5F3FF` |
| Heading | "Local Store Hub" (Outfit ExtraBold 40; "Local" `#7B4FA2`, "Store Hub" `#0E0E2C`) |
| Subtitle | "Upcoming events, tournaments, and community nights at your local Zeeks store." (Rubik 16, `#0E0E2C` @ 60%) |
| Header link | "VIEW ALL EVENTS" (Rubik Bold 14 UPPER, `#E89516`) + arrow → `/events` |
| Layout | Vertical, padding 80, gap 48; header row + events grid |

### 3. Event Card

A display-only card (no per-card link).

| Aspect | Value |
|--------|-------|
| Background | `#FFFFFF` |
| Border | `#CDCDD8`, 1px |
| Radius | 16 |
| Shadow | 0 10px 24px -10 rgba(14, 14, 44, 0.078) |
| Padding | 24, vertical gap 16 |
| Category badge | bg `#F5A623`, radius 4, text white Rubik ExtraBold 12 UPPER |
| Date/time | Rubik Bold 13, `#E89516` |
| Title | Outfit Bold 22, `#0E0E2C` |
| Description | Rubik Regular 14 / 21, `#9090A8` |

## Relationships

- **Local Store Hub Section** 1—N **Event Card**: the section renders a fixed set of four event cards (design parity).
- **Event Card** 1—1 **Event**: each card presents one `Event`'s fields (display-only).

## Validation Rules

- The section renders exactly four event cards (FR-003).
- Cards are display-only — no per-card link or anchor (FR-004).
- If the events list is empty, the section shows its header/link and an empty/neutral card area (no malformed cards) (FR-007).
- The "VIEW ALL EVENTS" link points to `/events` and must not 404 (FR-005).

## State Transitions

- **Page loads with events** → section renders header + four event cards in a row (stack on small screens).
- **Page loads with empty events list** → section renders header + link only (or neutral card area), no broken cards.