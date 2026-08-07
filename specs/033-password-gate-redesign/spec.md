# Feature Specification: Password Gate Redesign

**Feature Branch**: `033-password-gate-redesign`

**Created**: 2026-08-07

**Status**: Draft

**Input**: User description: "There is a new password-gate page design in the Figma, use MCP to get it. Create the new site wide password gate page to use this new layout and reset the cookie expiration date to 24 hours."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the new password gate page design (Priority: P1)

A visitor who has not yet entered the site password sees a redesigned, brand-consistent password page: a dark purple background with a central glow and ember accents, the Zeeks logo in the header, an "UNLOCK EARLY ACCESS" gate, and a footer with launch info and social links. This replaces the current plain white password page.

**Why this priority**: This is the core of the redesign — matching the new Figma layout so the site gate feels on-brand before visitors enter.

**Independent Test**: Can be verified by visiting any protected page without the password cookie and confirming the new dark-themed password page renders with the headline, form, and footer from the Figma design.

**Acceptance Scenarios**:

1. **Given** a visitor has no password cookie, **When** they request a protected page, **Then** they are shown the redesigned password gate page per the Figma layout.
2. **Given** the password gate page renders, **When** the visitor views it, **Then** it shows the Zeeks logo, the "SOMETHING EPIC IS COMING" headline, the password form with an "UNLOCK EARLY ACCESS" button, and a footer with launch info and social links.
3. **Given** the password gate page is displayed, **When** the visitor enters the correct password and submits, **Then** they are granted access and redirected to their original destination.

---

### User Story 2 - Keep the password validation behavior (Priority: P1)

Entering the correct password on the new page grants access; entering an incorrect password shows an error. The `returnTo` redirect is preserved.

**Why this priority**: The redesign must not break the existing access-control flow — the same password validation, error handling, and redirect behavior must work in the new layout.

**Independent Test**: Can be verified by submitting an incorrect password (error shown) and then the correct password (redirect to the original destination).

**Acceptance Scenarios**:

1. **Given** a visitor on the password gate page, **When** they enter an incorrect password, **Then** an error message is shown and access is not granted.
2. **Given** a visitor on the password gate page, **When** they enter the correct password, **Then** they are granted access and redirected to the original destination preserved in `returnTo`.

---

### User Story 3 - Reset the password cookie expiration to 24 hours (Priority: P1)

The site-password cookie, which currently lasts 7 days, now expires after 24 hours. After 24 hours, the visitor must re-enter the password.

**Why this priority**: This is an explicit requirement — shortening the gate cookie's lifetime to 24 hours for tighter access control.

**Independent Test**: Can be verified by inspecting the `site_password` cookie's `Max-Age`/expiration after a successful login, confirming it is set to 24 hours.

**Acceptance Scenarios**:

1. **Given** a visitor successfully enters the correct password, **When** the cookie is set, **Then** its expiration is 24 hours from the time of entry.
2. **Given** the password cookie has expired after 24 hours, **When** the visitor requests a protected page, **Then** they are redirected to the password gate again.

---

### Edge Cases

- What happens when the password is not configured (no `SITE_PASSWORD`)? No password gate applies; all routes are accessible.
- What happens when the visitor submits an empty password? The form should not submit or should show an appropriate error.
- What happens when the password API request fails (network error)? A user-friendly error message is shown.
- How does the new page behave on small screens? It should remain centered and usable (responsive).
- What happens to the social links and launch info? They are decorative/static content (not data), so they are safe to render statically.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The password gate page MUST render the new Figma layout: dark purple background, central glow, ember accents, Zeeks logo header, "SOMETHING EPIC IS COMING" headline, subhead, password form, "UNLOCK EARLY ACCESS" button, and a footer with launch info and social links.
- **FR-002**: The password gate page MUST accept the password and validate it against the site password, granting access on a correct match.
- **FR-003**: An incorrect password MUST display an error message and NOT grant access.
- **FR-004**: On successful access, the visitor MUST be redirected to the original destination preserved in the `returnTo` parameter.
- **FR-005**: The `site_password` cookie MUST expire 24 hours after it is set (down from 7 days).
- **FR-006**: When no `SITE_PASSWORD` is configured, the password gate MUST NOT be applied.
- **FR-007**: The password gate page MUST be responsive and usable on small screens.

### Key Entities *(include if feature involves data)*

- **Password Gate Page**: The site-wide page shown to visitors who have not entered the password.
- **Password Cookie**: The `site_password` cookie that authorizes access; expires after 24 hours.
- **ReturnTo**: The query parameter preserving the visitor's original destination for post-login redirect.
- **Launch/Social Info**: Static footer content (launch window text and social links) shown on the page.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The password gate page matches the Figma layout (dark theme, logo, headline, form, footer) with no visual regression from the design.
- **SC-002**: A visitor can enter the correct password and reach their original destination in a single flow.
- **SC-003**: An incorrect password shows an error and does not grant access.
- **SC-004**: The `site_password` cookie expires 24 hours after being set (verifiable via the cookie's expiration).
- **SC-005**: The password gate page renders correctly at desktop and mobile widths without broken layout.

## Assumptions

- The new design is a single layout (not a multi-size component set); responsive behavior is handled with existing Tailwind utilities.
- The social links (facebook, instagram, twitter, youtube) and launch window text ("COMING Q3 2026") are static decorative content without functional links (per the design).
- The password validation logic and `returnTo` redirect behavior from the current page are preserved; only the visual layout and cookie expiration change.
- The `@/components/ui/text-input` component (or an equivalent) exists to render the password input per the design's composed `text-input` instance.