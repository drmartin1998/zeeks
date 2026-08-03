# Feature Specification: Edit Profile Page

**Feature Branch**: `020-edit-profile`
**Created**: 2026-08-03
**Status**: Draft
**Input**: "Implement new edit-profile-page when a user clicks on edit from their account page. Update the relevant account information in both Square and Clerk. Implement negative scenario handling and retries and handle mismatch scenarios if the two get out of sync. Always consider Square the safe source for profile information and sync to Clerk accordingly."

## User Scenarios & Testing

### User Story 1 - Edit Personal Information (Priority: P1)

A logged-in customer navigates from their account dashboard to the edit profile page, updates their personal details (name, email, phone), and the changes persist in both Square and Clerk.

**Why this priority**: Personal information (name, email, phone) is the core profile data shared between Square and Clerk. This is the primary reason a user visits the edit profile page.

**Independent Test**: Log in, navigate to /account/edit, update first name and last name, submit. Verify changes appear in Square customer record and Clerk user profile. Reload the page and verify the form shows updated values.

**Acceptance Scenarios**:

1. **Given** a logged-in customer on the edit profile page with pre-populated fields from Square, **When** they change their first name and last name and click "Save Changes", **Then** Square customer record is updated first, Clerk profile is synced to match, and a success confirmation is displayed
2. **Given** a logged-in customer submits updated profile data, **When** the Square API update succeeds but the Clerk sync fails, **Then** the system retries the Clerk sync up to 3 times with exponential backoff, and if all retries fail, displays a warning that the save partially succeeded and will sync shortly
3. **Given** a logged-in customer submits updated profile data, **When** the Square API update fails (network error, 5xx), **Then** the system retries the Square update up to 2 times with exponential backoff, and if all retries fail, displays an error message with a "Try Again" option
4. **Given** a logged-in customer with stale Clerk data (mismatch between Square and Clerk), **When** they load the edit profile page, **Then** the form is pre-populated from Square (the authoritative source), and Clerk is silently synced to match Square in the background

---

### User Story 2 - Edit Shipping Address (Priority: P2)

A logged-in customer updates their default shipping address, which is stored in Square (Square is the only system that stores address data).

**Why this priority**: Address data lives exclusively in Square. This is a Square-only operation with no Clerk sync needed, making it simpler than P1 but still core profile functionality.

**Independent Test**: Log in, update the street address and city, submit. Verify the address is updated in Square. Reload and verify the saved address appears.

**Acceptance Scenarios**:

1. **Given** a logged-in customer with an existing shipping address, **When** they update the street address, city, state, and zip code and click "Save Changes", **Then** the Square customer address is updated and a success confirmation is displayed
2. **Given** a logged-in customer submits address data, **When** the Square API update fails after retries, **Then** an error message specific to the address section is displayed with a "Try Again" option

---

### User Story 3 - Change Password (Priority: P3)

A logged-in customer changes their password via Clerk's password management (Square does not handle authentication).

**Why this priority**: Password changes are Clerk-only operations, independent of Square. They are important for account security but do not involve the Square-Clerk sync complexity.

**Independent Test**: Log in, enter current password and new password, submit. Verify password is updated in Clerk. Log out and log back in with the new password.

**Acceptance Scenarios**:

1. **Given** a logged-in customer on the edit profile page, **When** they enter their current password, a new valid password (min 8 characters), confirm it, and click "Save Changes", **Then** Clerk updates the password and a success confirmation is displayed
2. **Given** a logged-in customer attempts to change password, **When** the current password is incorrect, **Then** an inline error is shown on the current password field: "Current password is incorrect" and the form is not submitted
3. **Given** a logged-in customer attempts to change password, **When** the new password and confirm password do not match, **Then** an inline error is shown on the confirm password field: "Passwords do not match"
4. **Given** a logged-in customer attempts to change password, **When** the new password is fewer than 8 characters, **Then** an inline error is shown on the new password field: "Password must be at least 8 characters"

---

### Edge Cases

- **Square API unavailable on page load**: Show a full-page error with retry button. The user cannot edit profile data until Square is reachable (Square is the source of truth).
- **Clerk API unavailable on page load (Square available)**: Load profile from Square, display a non-blocking banner: "Some profile sync features are temporarily unavailable. Your changes will sync automatically."
- **Square customer has no address on file**: Show empty fields with placeholders in the address section. Form is editable.
- **Square customer has no phone number**: Show empty phone number field. Form is editable.
- **User submits empty form (no changes)**: Disable the "Save Changes" button until at least one field differs from the original values.
- **Concurrent editing in two tabs**: If the user submits changes in tab A while tab B has stale data, tab B's submission should still work (last write wins at Square), but stale Clerk data in tab B is detected and synced from Square first.
- **Email already taken in Clerk when syncing**: Clerk's `updateUser` for email sends a verification email. If email change fails because it's taken, display: "This email address is already in use by another account."
- **Partial save across sections**: If personal info saves but address fails, display section-specific errors. Already-saved sections show success state.
- **Empty password fields**: If all three password fields are empty, skip the password change operation entirely (treat as "no password change requested").

## Requirements

### Functional Requirements

- **FR-001**: Page MUST be at route `/account/edit` as a protected route (Clerk middleware)
- **FR-002**: Page MUST be a Server Component that fetches current profile from Square on initial load to pre-populate the form
- **FR-003**: On page load, system MUST compare Square and Clerk profile data; if mismatch detected, Square data takes precedence and Clerk is silently synced
- **FR-004**: Form MUST be a Client Component with three sections: Personal Information, Default Shipping Address, Change Password
- **FR-005**: Personal Information fields MUST include: First Name, Last Name, Email Address, Phone Number (pre-populated from Square)
- **FR-006**: Address fields MUST include: Street Address, City, State, Zip Code (pre-populated from Square)
- **FR-007**: Password fields MUST include: Current Password, New Password, Confirm New Password
- **FR-008**: "Save Changes" button MUST be disabled when no fields have been modified from their original values
- **FR-009**: On form submission, personal information changes MUST be written to Square first (authoritative source), then synced to Clerk
- **FR-010**: Square API writes MUST be retried up to 2 times with exponential backoff (1s, 2s) before showing an error
- **FR-011**: Clerk sync after Square write MUST be retried up to 3 times with exponential backoff (1s, 2s, 4s); on total failure, show a non-blocking warning that sync will occur later
- **FR-012**: Address changes MUST be written to Square only (Clerk does not store address)
- **FR-013**: Password changes MUST be processed through Clerk only; Square is not involved
- **FR-014**: Password validation MUST require: current password is correct, new password is at least 8 characters, confirm password matches new password
- **FR-015**: System MUST display inline field validation errors (client-side) before submission
- **FR-016**: System MUST display section-specific success/error states after submission
- **FR-017**: "Cancel" button MUST return the user to `/account` without saving
- **FR-018**: Form MUST show a loading state on the submit button ("Saving...") and disable all inputs during submission
- **FR-019**: Phone number MUST be validated as E.164 format or equivalent US format before submission
- **FR-020**: The "Edit Profile" button on the account dashboard (profile-header-card) MUST link to `/account/edit`

### Key Entities

- **Square Customer**: Square Customer object with `id`, `givenName`, `familyName`, `emailAddress`, `phoneNumber`, `address` (containing `addressLine1`, `locality`, `administrativeDistrictLevel1`, `postalCode`). Authoritative source for profile data.
- **Clerk User**: Clerk user object with `id`, `firstName`, `lastName`, `emailAddresses`, `phoneNumbers`, `privateMetadata.squareCustomerId`. Synced from Square for profile fields; manages password independently.

## Success Criteria

- **SC-001**: Customers can edit and save personal information with changes persisting in both Square and Clerk within 5 seconds
- **SC-002**: Customers can edit and save their shipping address with changes persisting in Square within 3 seconds
- **SC-003**: Customers can change their password and immediately log in with the new credentials
- **SC-004**: If Square is unreachable, users see a clear error state with retry option (no white screen)
- **SC-005**: If Clerk sync fails after a successful Square write, users see a non-blocking warning (not a blocking error)
- **SC-006**: Form fields pre-populate correctly from Square data on page load within 3 seconds
- **SC-007**: All inline validation errors appear before submission (no server round-trip for validation)
- **SC-008**: The responsive layout matches the Figma design at 1440px, 768px, and 375px viewports

## Assumptions

1. The Clerk middleware at `middleware.ts` protects `/account` and all sub-routes. The edit profile page is at `/account/edit`.
2. Square's `CustomersApi.updateCustomer()` supports updating `givenName`, `familyName`, `emailAddress`, `phoneNumber`, and `address` in a single call.
3. Clerk's Backend API `updateUser()` supports syncing `firstName`, `lastName`, `emailAddress`, `phoneNumber` and changing password via `updatePassword()`.
4. The Square customer ID is stored in Clerk `privateMetadata.squareCustomerId` (established by spec 008).
5. Address data is stored only in Square (not duplicated to Clerk privateMetadata), matching the Figma design which shows address as a distinct section.
6. Password management is a Clerk-only operation. Square does not handle authentication.
7. The Figma design at node `143:2005` is the authoritative visual specification for this page.
8. Resume token/retry mechanisms for Clerk sync are out of scope for v1 — failed Clerk syncs show a warning but do not automatically retry after page navigation.
