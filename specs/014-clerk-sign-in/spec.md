# Feature Specification: Clerk Sign-In from Profile Icon

**Feature Branch**: `014-clerk-sign-in`

**Created**: 2026-08-02

**Status**: Draft

**Input**: User description: "when I click on the profile icon I want to be prompted to sign up or login using Clerk."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Trigger Sign-In from Profile Icon (Priority: P1)

An unauthenticated visitor browsing the Zeeks site clicks the user/profile icon in the top navigation bar. They are presented with Clerk's sign-in and sign-up interface, where they can create an account using email/password or Google OAuth, or sign into an existing account. After successful authentication, they return to the page they were browsing.

**Why this priority**: This is the core entry point for authentication. Without this, users have no way to sign in or create an account from the site. All subsequent authenticated features (order history, saved preferences, checkout) depend on this working.

**Independent Test**: Can be fully tested by loading any page on the site, clicking the profile icon, and verifying the Clerk authentication UI appears. A test user can complete sign-up or sign-in and land back on the original page.

**Acceptance Scenarios**:

1. **Given** a visitor is not signed in and viewing any page on the Zeeks site, **When** they click the profile icon in the navigation bar, **Then** the Clerk sign-in/sign-up interface is displayed, allowing the visitor to create an account or sign in.
2. **Given** the Clerk sign-in modal is open, **When** a visitor completes the sign-up flow with valid credentials, **Then** they are returned to the page they were viewing and the profile icon reflects their authenticated state.
3. **Given** the Clerk sign-in modal is open, **When** a visitor completes the sign-in flow with valid existing credentials, **Then** they are returned to the page they were viewing and the profile icon reflects their authenticated state.
4. **Given** the Clerk sign-in modal is open, **When** a visitor dismisses the modal without signing in, **Then** they return to the page they were viewing without any authentication state change.

---

### User Story 2 - Authenticated User Indicator (Priority: P2)

A signed-in user sees a visual indication of their authenticated state in the navigation bar. Instead of a generic user icon, they see their avatar or a user menu that confirms they are signed in and provides access to sign out.

**Why this priority**: After signing in, users need clear feedback that they are authenticated. Without this indicator, users may attempt to sign in again unnecessarily or be confused about their session state.

**Independent Test**: Can be fully tested by signing in via the profile icon, then verifying the navigation bar shows the authenticated user state (avatar or user menu) instead of the generic user icon. Signing out restores the generic icon.

**Acceptance Scenarios**:

1. **Given** a user is signed in, **When** they view any page on the site, **Then** the navigation bar displays their user avatar or a personalized user menu instead of the generic profile icon.
2. **Given** a user is signed in and their avatar/menu is displayed, **When** they choose to sign out, **Then** their session ends and the navigation bar returns to showing the generic profile icon.
3. **Given** a user is signed in and closes their browser, **When** they reopen the site in the same browser within the session validity period, **Then** they remain signed in without needing to re-authenticate.

---

### User Story 3 - Session Persistence Across Navigation (Priority: P3)

A signed-in user navigates between pages on the Zeeks site and their authentication session persists seamlessly. They are not prompted to sign in again as they browse categories, product pages, or search results.

**Why this priority**: Session persistence is expected behavior for any authenticated web experience. While critical for a polished UX, the basic sign-in flow (P1) and indicator (P2) provide value even if session persistence needs refinement.

**Independent Test**: Can be fully tested by signing in, navigating to at least 3 different pages (home, category, product detail), and verifying the authenticated state is maintained on every page without re-prompting.

**Acceptance Scenarios**:

1. **Given** a user is signed in, **When** they navigate to a different page on the site (e.g., from home to a category page), **Then** their authenticated state persists and the user avatar/menu remains visible.
2. **Given** a user is signed in, **When** they perform a hard page refresh, **Then** their authenticated state is preserved and they are not prompted to sign in again.

---

### Edge Cases

- What happens when a user clicks the profile icon while Clerk's services are experiencing an outage? The system should display a user-friendly error message rather than a blank screen or infinite loading state.
- What happens when a user's Clerk session expires mid-browsing? On the next navigation or interaction, the profile icon should revert to the unauthenticated state without disrupting the user's current page view.
- What happens when a user is already signed in on another tab and opens a new tab? The new tab should recognize the existing session automatically.
- What happens when Clerk environment variables (publishable key, secret key) are not configured? The site should degrade gracefully—the profile icon should still render but clicking it should show a configuration error or do nothing, rather than crashing the entire page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST wrap the application with Clerk authentication provider so that all pages can access the user's authentication state.
- **FR-002**: System MUST render a clickable profile icon in the navigation bar that is accessible (keyboard-navigable, proper ARIA label).
- **FR-003**: System MUST open Clerk's sign-in/sign-up interface when an unauthenticated visitor clicks the profile icon, offering email/password and Google OAuth as authentication methods.
- **FR-003a**: System MUST display a brief loading spinner in place of the profile icon while the Clerk sign-in modal is loading.
- **FR-004**: System MUST display the authenticated user's avatar or a user menu button when the user is signed in.
- **FR-005**: System MUST allow signed-in users to sign out, returning the profile icon to its unauthenticated state.
- **FR-006**: System MUST persist authentication sessions across page navigations and browser refreshes within the Clerk session lifetime.
- **FR-007**: System MUST handle Clerk service unavailability gracefully by showing an appropriate error message instead of crashing or hanging.
- **FR-008**: System MUST log the user in via Clerk's `squareCustomerId` sync pipeline (already implemented via webhook in spec 008/013) when a new user signs up, ensuring the Square customer ID is attached to the Clerk user profile.

### Key Entities

- **Authenticated User**: A visitor who has signed up or signed in through Clerk. Key attributes include a unique identifier, email address, display name, and a linked Square customer ID (set via the existing Clerk-to-Square webhook pipeline).
- **Authentication Session**: A Clerk-managed session token that persists across page loads and determines whether the profile icon shows the authenticated or unauthenticated state. Session lifetime is governed by Clerk's configuration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can create an account and return to browsing in under 2 minutes from the moment they click the profile icon.
- **SC-002**: A returning user can sign in and reach their authenticated state in under 30 seconds from clicking the profile icon.
- **SC-003**: Authenticated state is correctly reflected on the profile icon within 1 second of page load on all site pages.
- **SC-004**: 95% of sign-in/sign-up attempts complete without errors under normal Clerk service conditions.
- **SC-005**: The profile icon interaction (click to sign-in modal open) responds in under 2 seconds for unauthenticated users.

## Clarifications

### Session 2026-08-02

- Q: Which authentication methods should Clerk offer? → A: Email + Google OAuth
- Q: Should auth events be logged server-side? → A: No — rely on Clerk Dashboard analytics only
- Q: What does the user see while the Clerk modal is loading after clicking the profile icon? → A: A brief loading spinner replaces the icon

## Assumptions

- **Clerk account and application already configured**: A Clerk application exists with the Zeeks domain configured as an allowed origin. The Clerk publishable key and secret key are available as environment variables (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`).
- **Clerk-to-Square webhook pipeline is operational**: Specs 008 and 013 already implemented the backend webhook handler at `/api/webhooks/clerk` that creates Square customers and syncs the Square customer ID to Clerk metadata. This feature reuses that pipeline without modification.
- **No route protection in v1**: This feature does NOT gate any pages behind authentication. All pages remain publicly accessible. The profile icon is an opt-in entry point for users who want to create an account or sign in. Route protection may be added in a future feature.
- **Clerk UI components used as-is**: The feature uses Clerk's pre-built UI components (`<SignInButton>`, `<UserButton>`) without custom styling beyond what Clerk's appearance API provides, keeping the implementation minimal and leveraging Clerk's accessibility compliance.
- **Desktop and mobile supported**: The feature works on all viewport sizes since both the navigation bar and Clerk components are responsive.
- **Clerk session lifetime uses Clerk defaults**: Session duration, token refresh, and other session management settings use Clerk's default configuration unless explicitly overridden in the Clerk Dashboard.
- **Observability via Clerk Dashboard**: Authentication event monitoring (sign-ups, sign-ins, failures) relies on Clerk's built-in analytics dashboard. No additional server-side logging is implemented for auth events in v1.
