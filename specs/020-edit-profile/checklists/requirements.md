# Requirements Checklist: Edit Profile Page (`020-edit-profile`)

## Functional Requirements Coverage

| FR | Requirement | Gherkin Coverage | Implementation Status |
|----|-------------|------------------|----------------------|
| FR-001 | Route at `/account/edit` protected by Clerk middleware | @edge "Square API unavailable on page load" | [ ] |
| FR-002 | Server Component fetches profile from Square on load | Background step | [ ] |
| FR-003 | Mismatch detection: Square wins, Clerk silently synced | @US1 @edge "Clerk data is stale" | [ ] |
| FR-004 | Client form with 3 sections: Personal, Address, Password | All scenarios | [ ] |
| FR-005 | Personal fields: First Name, Last Name, Email, Phone, pre-populated | @US1 scenarios | [ ] |
| FR-006 | Address fields: Street, City, State, Zip, pre-populated | @US2 scenarios | [ ] |
| FR-007 | Password fields: Current, New, Confirm | @US3 scenarios | [ ] |
| FR-008 | Save button disabled when no fields modified | @edge "Save button disabled" / "Save button enabled" | [ ] |
| FR-009 | Personal info writes to Square first, then Clerk | @US1 scenarios | [ ] |
| FR-010 | Square API retry: 2 attempts, exponential backoff (1s, 2s) | @US1 @edge "Square API update fails" | [ ] |
| FR-011 | Clerk sync retry: 3 attempts, exponential backoff (1s, 2s, 4s) | @US1 @edge "Clerk sync fails after retries" | [ ] |
| FR-012 | Address changes write to Square only | @US2 scenarios | [ ] |
| FR-013 | Password changes via Clerk only | @US3 scenarios | [ ] |
| FR-014 | Password validation: current correct, new ≥8 chars, confirm match | @US3 scenarios | [ ] |
| FR-015 | Inline field validation before submission | @US3 "passwords do not match" / "too short" | [ ] |
| FR-016 | Section-specific success/error states | @US1 @edge "Clerk sync fails" / @US2 @edge | [ ] |
| FR-017 | Cancel returns to /account | @edge "Cancel returns to account page" | [ ] |
| FR-018 | Loading state: "Saving..." on button, inputs disabled | (implicit in submit flow) | [ ] |
| FR-019 | Phone validation (E.164 / US format) | (inferred from sign-up form pattern) | [ ] |
| FR-020 | Edit Profile button on account page links to /account/edit | (structural, not in gherkin) | [ ] |

## Test Coverage Requirements

| Layer | What to Test | File |
|-------|-------------|------|
| Static | tsc --noEmit, npm run lint | All files |
| Unit | retry utility (lib/utils/retry.ts) | lib/utils/__tests__/retry.test.ts |
| Unit | Clerk sync utility (lib/clerk/sync.ts) | lib/clerk/__tests__/sync.test.ts |
| Unit | Profile service (lib/square/profile.ts) | lib/square/__tests__/profile.test.ts |
| Unit | Zod schemas (form + API validation) | (co-located with schemas) |
| Integration | API route GET/PUT /api/account/profile | app/api/account/profile/__tests__/route.test.ts |
| Integration | Edit profile page render | app/account/edit/__tests__/page.test.tsx |
| Integration | Form submission (success + error + retry) | app/account/edit/__tests__/edit-profile-form.test.tsx |
| Integration | Profile header card Edit button | components/account/__tests__/profile-header-card.test.tsx |

## Edge Case Coverage

- [ ] Square API unavailable on page load → full-page error with retry
- [ ] Clerk API unavailable on page load → banner warning, Square data used
- [ ] Square customer has no address → empty fields with placeholders
- [ ] Square customer has no phone → empty phone field, editable
- [ ] No fields modified → Save button disabled
- [ ] Empty password fields → password operation skipped
- [ ] Email already taken in Clerk → warning displayed, Square update preserved
- [ ] Partial save (one section fails, another succeeds) → section-specific status
