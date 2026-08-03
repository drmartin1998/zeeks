# Feature Specification: Remove Account Settings Button

**Feature Branch**: `021-remove-account-settings`
**Created**: 2026-08-03
**Status**: Draft
**Input**: "Remove account settings button from profile page"

## User Scenarios & Testing

### User Story 1 - Remove Account Settings Button (Priority: P1)

The "Account Settings" button on the account dashboard profile card is non-functional (no handler) and has no planned feature behind it. It should be removed to avoid user confusion.

**Why this priority**: A non-functional button degrades user trust and creates a dead-end interaction. This is a single-file cleanup task.

**Independent Test**: Load the account dashboard at `/account` and verify the profile card shows only the "Edit Profile" link, with no "Account Settings" button present.

**Acceptance Scenarios**:

1. **Given** a logged-in customer on the account dashboard, **When** the profile card renders, **Then** only the "Edit Profile" link is visible and the "Account Settings" button is absent
2. **Given** a logged-in customer with a profile error, **When** the profile card shows the error state, **Then** no "Account Settings" button is rendered

## Requirements

### Functional Requirements

- **FR-001**: The "Account Settings" button MUST be removed from `components/account/profile-header-card.tsx`

## Success Criteria

- **SC-001**: The account dashboard renders without any "Account Settings" button
- **SC-002**: All existing tests continue to pass

## Assumptions

1. There is no pending feature for "Account Settings" that would be added in the near future
2. The removal is purely presentational and does not affect any API calls or data flow
