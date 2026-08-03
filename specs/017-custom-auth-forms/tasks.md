# Tasks: Custom Login & Sign-Up Forms

**Input**: Design documents from `/specs/017-custom-auth-forms/`

**Prerequisites**: plan.md (required), spec.md (required)

**Tests**: Following the Testing Trophy (Kent C. Dodds). Integration tests for form components and nav-bar dropdown; unit tests for validation logic. Tests written FIRST and verified to FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared directories, update Clerk configuration

- [ ] T001 create directories `components/auth/`, `app/sign-in/`, `app/sign-up/` and their `__tests__/` subdirectories
- [ ] T002 [P] Update `app/layout.tsx` — add `signInUrl="/sign-in"` and `signUpUrl="/sign-up"` props to `<ClerkProvider>`
- [ ] T003 [P] Add `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` to `.env.local`

---

## Phase 2: User Story 1 — Profile Icon Dropdown (Priority: P1) 🎯 MVP

**Goal**: Replace the existing `<SignInButton mode="modal">` in the nav bar with a custom dropdown that provides "Login" and "Sign Up" options linking to `/sign-in` and `/sign-up`.

**Independent Test**: Click the profile icon as a logged-out user; verify dropdown renders with two options; click Login; verify navigation to `/sign-in`.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

- [ ] T004 [P] [US1] Create `components/auth/__tests__/auth-dropdown.test.tsx` — test: renders dropdown on click, shows Login and Sign Up options, Login navigates to /sign-in, Sign Up navigates to /sign-up, closes on outside click, closes on Escape key, does not render when signed in
- [ ] T005 [P] [US1] Update `components/__tests__/nav-bar.test.tsx` — update existing tests that reference `<SignInButton>` to test the new `<AuthDropdown>` component instead

### Implementation for User Story 1

- [ ] T006 [US1] Create `components/auth/auth-dropdown.tsx` — client component with `useState` for open/close, renders dropdown menu with two items on click, closes on outside click (via `useEffect` listener) and Escape key
- [ ] T007 [US1] Update `components/nav-bar.tsx` — replace `<SignInButton mode="modal">` with `<AuthDropdown />` in the unauthenticated branch, keep `<UserButton />` for authenticated users

**Checkpoint**: Profile icon shows dropdown with Login and Sign Up — both navigate to their pages

---

## Phase 3: User Story 2 — Sign-In Form (Priority: P2)

**Goal**: Create a custom sign-in page at `/sign-in` using Clerk's `useSignIn()` hook. Fields: email and password. Validates empty fields client-side before API call. Shows Clerk API errors as a banner.

**Independent Test**: Navigate to `/sign-in`; enter valid credentials; submit; verify authenticated and redirected.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

- [ ] T008 [P] [US2] Create `components/auth/__tests__/sign-in-form.test.tsx` — test: renders email and password inputs, renders submit button, shows "Email is required" when email empty on submit, shows "Password is required" when password empty on submit, calls `signIn.create()` with correct params on submit, displays Clerk API error banner on failure, shows loading state during submission, displays "Don't have an account? Sign up" link
- [ ] T009 [P] [US2] Create `app/sign-in/__tests__/page.test.tsx` — test: redirects authenticated user to home, renders SignInForm for unauthenticated user

### Implementation for User Story 2

- [ ] T010 [US2] Create `components/auth/sign-in-form.tsx` — client component with email field, password field, submit button, inline field errors, API error banner, "Don't have an account? Sign up" link. Uses `useSignIn()` hook.
- [ ] T011 [US2] Create `app/sign-in/page.tsx` — client page component: checks `useAuth().isSignedIn` → redirect to home if true, otherwise renders `<SignInForm />` wrapped in site layout (NavBar + Footer)

**Checkpoint**: Users can sign in via custom form at `/sign-in`

---

## Phase 4: User Story 3 — Sign-Up Form (Priority: P3)

**Goal**: Create a custom sign-up page at `/sign-up` using Clerk's `useSignUp()` hook. Fields: first name, last name, email, phone (E.164), password, verify password. Validates all fields client-side before API call. Shows Clerk API errors as a banner.

**Independent Test**: Navigate to `/sign-up`; fill all 6 fields with valid data; submit; verify account created and authenticated.

### Tests for User Story 3 (MANDATORY — Testing Trophy)

- [ ] T012 [P] [US3] Create `components/auth/__tests__/sign-up-form.test.tsx` — test: renders all 6 fields and submit button, shows field-level required errors on empty submit, shows "Passwords do not match" when passwords differ, shows phone format error for non-E.164 input, calls `signUp.create()` with correct params (firstName, lastName, emailAddress, phoneNumber, password) on submit, displays Clerk API error banner on failure (e.g., duplicate email), shows loading state during submission, displays "Already have an account? Sign in" link
- [ ] T013 [P] [US3] Create `app/sign-up/__tests__/page.test.tsx` — test: redirects authenticated user to home, renders SignUpForm for unauthenticated user

### Implementation for User Story 3

- [ ] T014 [US3] Create `components/auth/sign-up-form.tsx` — client component with all 6 fields, validation logic (required checks, password match, phone E.164 regex), inline field errors, API error banner, "Already have an account? Sign in" link. Uses `useSignUp()` hook.
- [ ] T015 [US3] Create `app/sign-up/page.tsx` — client page component: checks `useAuth().isSignedIn` → redirect to home if true, otherwise renders `<SignUpForm />` wrapped in site layout (NavBar + Footer)

**Checkpoint**: New users can sign up via custom form at `/sign-up` with all 6 fields

---

## Phase 5: Polish & Quality Gates

**Purpose**: Final validation, linting, and cross-cutting concerns

- [ ] T016 [P] Create `app/sign-in/layout.tsx` and `app/sign-up/layout.tsx` if needed for shared auth page styling (optional — use Tailwind directly if simple)
- [ ] T017 Run `npm test` — all vitest suites pass with zero failures
- [ ] T018 Run `tsc --noEmit` — zero TypeScript errors
- [ ] T019 Run `npm run lint` — zero ESLint errors
- [ ] T020 Validate all 16 Gherkin scenarios from `features/custom-auth-forms.feature` are covered by integration/E2E tests

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **User Story 1 (Phase 2)**: Depends on Setup — 🎯 MVP
- **User Story 2 (Phase 3)**: Depends on US1 (dropdown links to /sign-in)
- **User Story 3 (Phase 4)**: Depends on US1 (dropdown links to /sign-up)
- **Polish (Phase 5)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No other story dependencies — starts after Setup
- **User Story 2 (P2)**: Depends on US1 (dropdown provides navigation entry point)
- **User Story 3 (P3)**: Depends on US1 (dropdown provides navigation entry point)

### Parallel Opportunities

- T002, T003 (Setup): Both [P], run in parallel
- T004, T005 (US1 tests): Both [P], different test files
- T008, T009 (US2 tests): Both [P], different test files
- T010, T011 (US2 implementation): T010 (form component) and T011 (page) can run in parallel
- T012, T013 (US3 tests): Both [P]
- T014, T015 (US3 implementation): Parallel
- T016—T020 (Polish): All independent

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (directories, ClerkProvider config)
2. Complete Phase 2: User Story 1 (dropdown)
3. **STOP and VALIDATE**: Click profile icon, verify dropdown with Login/Sign Up
4. Deploy/demo if ready — entry points for auth are in place

### Incremental Delivery

1. Setup → Foundation ready
2. Add US1 → Test independently → Deploy/Demo (dropdown works)
3. Add US2 → Test independently → Deploy/Demo (sign-in works)
4. Add US3 → Test independently → Deploy/Demo (sign-up works)
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The existing `ClerkErrorBoundary` in `nav-bar.tsx` must be preserved
- After sign-up, the Clerk webhook (spec 008) and loyalty enrollment (spec 016) fire automatically — no additional code needed for customer/loyalty sync
