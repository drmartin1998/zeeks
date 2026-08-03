# Feature Specification: Custom Login & Sign-Up Forms

**Feature Branch**: `017-custom-auth-forms`
**Created**: 2026-08-02
**Status**: Draft
**Input**: "When a logged out user clicks on the profile icon in the header, a dropdown menu should appear with an option to login or sign-up. Clicking login takes them to a custom login form while signing up takes them to a custom sign-up form."

## Clarifications

### Session 2026-08-02

- Q: Should the dropdown replace the existing Clerk modal or supplement it? — A: Replace it. The profile icon for unauthenticated visitors now opens a dropdown with "Login" and "Sign Up" options that navigate to custom pages. The `<SignInButton mode="modal">` is removed.

- Q: What fields on the sign-in form? — A: Email address and password. A "Don't have an account? Sign up" link redirects to the sign-up page.

- Q: What fields on the sign-up form? — A: First name, last name, email address, phone number, password, and verify password. A "Already have an account? Sign in" link redirects to the sign-in page.

- Q: Where should users be redirected after successful authentication? — A: Back to the page they were on before clicking sign-in/sign-up. If they navigated directly to `/sign-in` or `/sign-up`, redirect to the home page (`/`).

- Q: How should validation errors be displayed? — A: Inline below each field (e.g., "Invalid email address", "Passwords do not match"). Clerk API errors (e.g., "Email already in use") are displayed as a banner at the top of the form.

- Q: Should the phone number field be required on sign-up? — A: Yes. A phone number is required for Square loyalty enrollment (spec 016). The form validates E.164 format.

## User Stories

### US1 (P1) — Profile Icon Dropdown

**Why this priority**: This is the entry point. Users must be able to discover and navigate to the sign-in and sign-up forms.

**Independent Test**: Visit the site as a logged-out user; click the profile icon; verify a dropdown renders with "Login" and "Sign Up" options; click Login; verify navigation to `/sign-in`.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor, **When** they click the profile icon in the nav bar, **Then** a dropdown menu appears with "Login" and "Sign Up" options
2. **Given** the dropdown is open, **When** the visitor clicks "Login", **Then** they navigate to `/sign-in`
3. **Given** the dropdown is open, **When** the visitor clicks "Sign Up", **Then** they navigate to `/sign-up`
4. **Given** the dropdown is open, **When** the visitor clicks outside the dropdown or presses Escape, **Then** the dropdown closes
5. **Given** an authenticated user, **When** they view the nav bar, **Then** the profile icon shows the existing `<UserButton />` (no dropdown for logout users)

---

### US2 (P2) — Sign-In Form

**Why this priority**: Returning users must be able to log in. This is the core authentication flow.

**Independent Test**: Navigate to `/sign-in`; enter a valid email and password; submit; verify the user is authenticated and redirected to the previous page.

**Acceptance Scenarios**:

1. **Given** a visitor on the `/sign-in` page, **When** they enter a valid email and password and submit, **Then** they are authenticated via Clerk and redirected to the previous page (or home if no referrer)
2. **Given** a visitor on the `/sign-in` page, **When** they enter an invalid email or password and submit, **Then** an inline error message is displayed
3. **Given** a visitor on the `/sign-in` page, **When** they submit with an empty email or password field, **Then** an inline validation error is shown on the empty field
4. **Given** an already authenticated user, **When** they navigate to `/sign-in`, **Then** they are redirected to the home page

---

### US3 (P3) — Sign-Up Form

**Why this priority**: New users must be able to create an account with complete profile information for loyalty enrollment. This is the most complex form.

**Independent Test**: Navigate to `/sign-up`; fill in all fields with valid data; submit; verify the user is authenticated, a Clerk account is created with the provided details, and they are redirected to the previous page.

**Acceptance Scenarios**:

1. **Given** a visitor on the `/sign-up` page, **When** they fill in all fields (first name, last name, email, phone, password, verify password) with valid data and submit, **Then** a Clerk account is created, the user is authenticated, and they are redirected to the previous page (or home)
2. **Given** a visitor on the `/sign-up` page, **When** they submit with mismatched passwords, **Then** a validation error "Passwords do not match" is shown on the verify password field
3. **Given** a visitor on the `/sign-up` page, **When** they submit with an email already registered, **Then** a Clerk API error banner is shown ("An account with this email already exists")
4. **Given** a visitor on the `/sign-up` page, **When** they submit with an invalid phone number format, **Then** a validation error is shown on the phone field
5. **Given** a visitor on the `/sign-up` page, **When** they submit with any required field empty, **Then** an inline validation error is shown on that field
6. **Given** an already authenticated user, **When** they navigate to `/sign-up`, **Then** they are redirected to the home page

---

### Edge Cases

- What happens when Clerk is unreachable or returns a network error? Display a generic error banner ("Unable to connect. Please try again.") and do not redirect.
- What happens when the user's session expires while on the sign-in page? The form still renders; submitting will authenticate a new session.
- What happens on mobile viewports? Forms should be responsive — full width, stacked layout, reduced padding.
- What happens when the user navigates back after signing in? The referrer-based redirect handles this; if referrer is the sign-in page itself, redirect to home.
- What happens when the dropdown is already open and the user clicks the profile icon again? The dropdown closes (toggle behavior).

## Functional Requirements

- **FR-001**: The nav bar profile icon MUST render a dropdown menu for unauthenticated visitors with "Login" and "Sign Up" menu items
- **FR-002**: The dropdown MUST close when the user clicks outside it or presses the Escape key
- **FR-003**: Clicking "Login" MUST navigate to `/sign-in`; clicking "Sign Up" MUST navigate to `/sign-up`
- **FR-004**: The `/sign-in` page MUST be a client component using Clerk's `useSignIn()` hook — fields: email (text input) and password (password input)
- **FR-005**: The `/sign-up` page MUST be a client component using Clerk's `useSignUp()` hook — fields: first name (text), last name (text), email (text), phone (text, E.164), password (password), verify password (password)
- **FR-006**: Both forms MUST display inline validation errors below each field and a banner for Clerk API errors
- **FR-007**: On successful sign-in or sign-up, the user MUST be redirected to the previous page (via `returnBackUrl` or referrer), falling back to home (`/`)
- **FR-008**: Already-authenticated users navigating to `/sign-in` or `/sign-up` MUST be redirected to home
- **FR-009**: The sign-up form MUST validate phone number format (E.164: `+[country][number]`) before submission
- **FR-010**: The sign-up form MUST validate that password and verify password match before submission
- **FR-011**: The sign-in form MUST include a link to `/sign-up` ("Don't have an account? Sign up"); the sign-up form MUST include a link to `/sign-in` ("Already have an account? Sign in")
- **FR-012**: The existing `<SignInButton mode="modal">` in `nav-bar.tsx` MUST be replaced with the dropdown
- **FR-013**: Clerk environment variables (`NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`) MUST be set so Clerk redirects (e.g., from email verification) go to the custom pages

## Key Entities

- **Sign-In Form State**: Email address (string), password (string), field errors (record of field → message), API error (string | null), loading state (boolean).
- **Sign-Up Form State**: First name (string), last name (string), email (string), phone (string), password (string), verify password (string), field errors (record), API error (string | null), loading state (boolean).
- **Auth Dropdown**: A client component rendering a popover/dropdown menu with two items (Login, Sign Up), toggled by the profile icon click.

## Success Criteria

- **SC-001**: An unauthenticated visitor can navigate from the profile icon dropdown to the sign-in page in under 2 seconds
- **SC-002**: A new user can complete sign-up (fill all 6 fields, submit) and be authenticated in under 5 seconds
- **SC-003**: All validation errors (empty fields, mismatched passwords, invalid email, invalid phone) display inline before any API call is made
- **SC-004**: Clerk API errors (duplicate email, invalid credentials) display as a banner without clearing the form
- **SC-005**: Both forms are usable on mobile viewports (320px+) without horizontal scrolling

## Assumptions

1. Clerk email/password authentication strategy is enabled in the Clerk Dashboard.
2. The Clerk `useSignIn()` and `useSignUp()` hooks are fully compatible with the installed `@clerk/nextjs` v7.6.4.
3. The existing Clerk webhook pipeline (spec 008 — customer sync) and loyalty enrollment (spec 016) will fire after a new user signs up, creating the Square customer and loyalty account automatically.
4. The `ClerkErrorBoundary` in `nav-bar.tsx` will be preserved for Clerk component failures.
5. The phone number field uses E.164 format (`+15551234567`). Client-side validation checks for the `+` prefix and numeric country/number.
6. `ClerkProvider` in `layout.tsx` will be updated with `signInUrl` and `signUpUrl` props pointing to the custom pages.
7. Middleware at `middleware.ts` does not need changes — `/sign-in` and `/sign-up` are public routes by default since they are not in the `/account` matcher.
8. Password requirements (minimum length, complexity) are configured in the Clerk Dashboard and enforced server-side by Clerk.
