# Feature Specification: Navigation Location Bar

**Feature**: Navigation Location Bar
**Status**: Draft
**Created**: 2026-08-03

## Overview

Display the store's city and today's operating hours in the site navigation bar so visitors can quickly see where the store is and whether it is currently open — without needing to visit a separate "Locations" or "Contact" page.

Since Zeeks operates a single physical store, this is purely an informational display, not a store selector or location picker.

## Clarifications

### Session 2026-08-03

- Q: Should the location bar include the store name alongside the address and hours, or address and hours alone? → A: Display city + hours only (no store name, no full street address).
- Q: What level of accessibility should the location/status bar meet for screen readers and assistive technology? → A: Basic — announces location and open/closed status text on page load, no live region updates.
- Q: How should the location bar behave on narrow/mobile screens? → A: Follow the Figma design exactly for all breakpoints.
- Q: Should the status indicator include a "Closing Soon" state when within a short window of closing time? → A: Show "Closing Soon" when within 30 minutes of closing time.
- Q: When location/hours data fails to load, what should the fallback display in the navigation bar show? → A: Hide the location bar entirely — show only navigation links.

## User Scenarios & Testing (Gherkin)

### User Story 1 — See Store City at a Glance (Priority: P1)

A customer browsing the site can see the store's city in the navigation bar on every page, so they always know where to find the physical store.

**Acceptance Scenarios**:

1. **Given** a customer loads any page on the site
   **When** the navigation bar renders
   **Then** the store's city name is displayed in the navigation bar

2. **Given** a customer views the navigation bar
   **When** they read the location text
   **Then** the text clearly identifies the store's city in a human-readable format (e.g., "Seattle, WA")

### User Story 2 — See Today's Hours at a Glance (Priority: P1)

A customer can see whether the store is currently open by viewing today's operating hours in the navigation bar, helping them decide whether to visit immediately.

**Acceptance Scenarios**:

1. **Given** the store has defined hours for today
   **When** the navigation bar renders on any page
   **Then** today's operating hours (e.g., "Open today: 9 AM – 9 PM") are displayed

2. **Given** the current time is within today's operating hours
   **When** the hours are displayed
   **Then** an indicator shows the store is "Open Now"

3. **Given** the current time is outside today's operating hours
   **When** the hours are displayed
   **Then** an indicator shows the store is "Closed Now"

4. **Given** the current time is within 30 minutes of today's closing time
   **When** the hours are displayed
   **Then** an indicator shows the store is "Closing Soon"

### User Story 3 — Consistent Display Across All Pages (Priority: P2)

The location and hours information is consistently visible across all public-facing pages, including the homepage, product pages, and informational pages.

**Acceptance Scenarios**:

1. **Given** a customer navigates between different pages on the site
   **When** they look at the navigation bar
   **Then** the location and hours information remains visible and consistent

### Edge Cases

- What happens if today's hours are not defined (e.g., holiday closure)? → Display "Closed today" or hide the hours portion.
- What if operating hours span midnight (e.g., 8 PM – 2 AM)? → The "Open Now" logic must correctly compute the current status.
- What if the store is closed for an extended period (e.g., renovation)? → Hours should reflect the closure and show "Temporarily Closed" or equivalent.
- What if the location or hours data fails to load? → The location bar MUST be hidden entirely; the navigation bar continues to render normally with all navigation links intact.

## Requirements

### Functional Requirements

- **FR-01**: The navigation bar MUST display the store's city (and state/region) on every public-facing page.
- **FR-02**: The navigation bar MUST display today's operating hours (opening and closing times) on every public-facing page.
- **FR-03**: The system MUST show an "Open Now," "Closing Soon," or "Closed Now" status indicator based on the current time relative to today's hours. "Closing Soon" is shown when the current time is within 30 minutes of the store's closing time.
- **FR-04**: The location and hours information MUST be sourced from the live store data backend, not from hardcoded or mock values.
- **FR-05**: The location bar MUST be visually integrated into the existing site navigation bar without disrupting current navigation links.
- **FR-06**: If location or hours data is unavailable (API failure), the location bar MUST be hidden entirely. The navigation bar MUST continue to render normally with all navigation links intact.
- **FR-07**: The system MUST correctly compute "Open Now" / "Closing Soon" / "Closed Now" status for hours that span midnight.
- **FR-08**: The location and status text MUST be announced to screen readers on page load (basic accessibility support).

### Key Entities

- **Store Location**: Represents the single physical store with city and state/region. The full street address is not displayed in the navigation bar.
- **Business Hours**: A set of operating hours per day of the week, each with an opening time and closing time. Includes support for closure days and special/holiday hours.
- **Open Status**: A computed state derived from the current day/time and the business hours — "Open Now," "Closing Soon" (within 30 minutes of closing), "Closed Now," or "Closed Today" (when no hours exist for the current day).

## Success Criteria

- **SC-01**: 100% of public-facing pages display the store location and today's hours in the navigation bar.
- **SC-02**: The "Open Now" / "Closing Soon" / "Closed Now" status updates correctly when a user visits the site at any time of day, including boundary times (store opening, 30 minutes before closing, store closing).
- **SC-03**: When the location or hours data fails to load, the location bar is hidden and the navigation bar renders all navigation links without visual breakage.
- **SC-04**: Customers can identify the store location and whether it's open within 2 seconds of the navigation bar rendering.

## Assumptions

- The store has a single physical location managed in the backend.
- Business hours are maintained in the backend and accessible via API.
- The navigation bar is part of a shared layout component that appears on all pages.
- The feature does not include a store selector, location picker, or multi-location support.
- "Today" is determined by the store's local timezone.
- Visual layout, breakpoint behavior, and styling are defined by the Figma design and serve as the source of truth for responsive presentation.
