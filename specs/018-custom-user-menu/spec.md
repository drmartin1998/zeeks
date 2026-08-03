# Feature Specification: Custom User Menu (Authenticated)

**Feature Branch**: `018-custom-user-menu`
**Created**: 2026-08-03
**Status**: Draft
**Input**: "Replace the default Clerk dropdown when logged in with a custom one that matches the style of the site. This should have the user's name, a logout link, and a link to their account page."

## Clarifications

### Session 2026-08-03

- Q: What should the user see when they've signed in with a social provider and have no name set? — A: Display the email address instead of the name. If neither name nor email is available, display "Account" as a fallback.

- Q: Should the dropdown use the same Portal-based pattern as the unauthenticated dropdown (AuthDropdown) from spec 017? — A: Yes. The authenticated dropdown should use the same Portal approach with fixed positioning to avoid layout overflow issues.

- Q: Should the user avatar/icon be included? — A: Use the profile icon (same SVG user icon) as the trigger, consistent with the unauthenticated state.

- Q: What happens when the user clicks "Logout"? — A: Call Clerk's `signOut()` method. The nav bar should re-render showing the unauthenticated profile icon.

## User Stories

### US1 (P1) — Custom Authenticated Dropdown

**Why this priority**: This is the entire feature. Replacing the default Clerk `<UserButton />` with a site-styled dropdown showing the user's name, account link, and logout.

**Independent Test**: Log in; verify the default Clerk UserButton is replaced with a custom dropdown showing the user's name; click to open; verify "My Account" and "Logout" links are present.

**Acceptance Scenarios**:

1. **Given** a signed-in user with name "Jane Doe", **When** they view the nav bar, **Then** the profile icon is displayed (not Clerk's UserButton), **And** clicking the icon opens a dropdown showing "Jane Doe" at the top
2. **Given** the authenticated dropdown is open, **When** the user clicks "My Account", **Then** they navigate to `/account`
3. **Given** the authenticated dropdown is open, **When** the user clicks "Logout", **Then** they are signed out via Clerk and the nav bar shows the unauthenticated profile icon
4. **Given** a signed-in user with no name but email "jane@example.com", **When** they view the nav bar and open the dropdown, **Then** the dropdown shows "jane@example.com" instead of a name

---

### Edge Cases

- What happens when Clerk's `useUser()` hook hasn't loaded yet? Show the profile icon but disable the click until loading completes.
- What happens when the signOut call fails? Log the error to the console; the user remains signed in and the dropdown stays open.
- What happens when the dropdown is open and the user clicks outside? The dropdown closes (same behavior as the unauthenticated AuthDropdown).
- What happens when the user navigates to `/account` from the dropdown? The dropdown closes and navigation occurs. On the account page, the authenticated state persists.

## Functional Requirements

- **FR-001**: The nav bar MUST replace Clerk's `<UserButton />` with a custom authenticated dropdown for signed-in users
- **FR-002**: The dropdown trigger MUST use the same profile icon SVG as the unauthenticated dropdown
- **FR-003**: The dropdown MUST display the user's full name (from `useUser()`) as a non-interactive header
- **FR-004**: The dropdown MUST contain a "My Account" link navigating to `/account`
- **FR-005**: The dropdown MUST contain a "Logout" link that calls Clerk's `signOut()` method
- **FR-006**: If the user has no name, the dropdown MUST display the user's email address instead
- **FR-007**: If neither name nor email is available, the dropdown MUST display "Account" as fallback text
- **FR-008**: The dropdown MUST use the same Portal-based `fixed` positioning pattern as `AuthDropdown` from spec 017
- **FR-009**: The dropdown MUST close when clicking outside or pressing Escape (same pattern as `AuthDropdown`)
- **FR-010**: The dropdown MUST NOT render or be interactive while Clerk's `useUser()` is still loading (`isLoaded === false`)

## Key Entities

- **Authenticated User**: A Clerk `UserResource` with `id`, `firstName`, `lastName`, `fullName`, `primaryEmailAddress`, and `imageUrl`. Retrieved via `useUser()`.
- **User Menu Dropdown**: A Portal-rendered dropdown with three rows: user display name (non-interactive), "My Account" link, "Logout" action button.

## Success Criteria

- **SC-001**: Signed-in users see their name instead of Clerk's default avatar button within 1 second of page load
- **SC-002**: Clicking "Logout" signs the user out and the nav bar immediately reflects the unauthenticated state
- **SC-003**: The dropdown renders above all other page elements (no clipping or z-index issues)
- **SC-004**: The dropdown does not cause page layout shift or additional scrollbars

## Assumptions

1. The `useUser()` hook from `@clerk/nextjs` is compatible with the installed version (v7.6.4) and provides `firstName`, `lastName`, `fullName`, and `primaryEmailAddress`.
2. The `useClerk()` hook (or `useAuth()`) provides access to the `signOut()` method.
3. The unauthenticated `AuthDropdown` component from spec 017 provides the Portal-based dropdown pattern that can be adapted for the authenticated variant.
4. The profile icon SVG in the authenticated dropdown should match the one in `AuthDropdown` for visual consistency.
5. Clerk's middleware continues to protect `/account` (already configured in `middleware.ts`).
6. The existing Clerk components (`Show`, `UserButton`) can be removed from the signed-in branch of `nav-bar.tsx`.
