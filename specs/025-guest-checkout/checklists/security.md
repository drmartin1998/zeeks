# Security & Auth Boundary Checklist: Guest Cart & Checkout

**Purpose**: Validate that security, auth boundary, and data isolation requirements are complete, clear, and consistent for the guest checkout feature
**Created**: 2026-08-03
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [tasks.md](../tasks.md)
**Audience**: Author self-review
**Depth**: Standard (~20 items)

**Note**: This checklist tests the REQUIREMENTS themselves — not the implementation. Every item asks whether the spec/plan/tasks are well-written, complete, and unambiguous regarding security and auth boundaries.

---

## Auth Boundary Requirements

- [x] CHK001 — Is the boundary between authenticated and guest code paths clearly specified — which server actions, pages, and components operate in both modes vs only one? [Clarity, Spec §FR-014, Plan §Source Code] → Resolved: Plan.md enumerates every file that changes (MODIFY labels) and the server-actions contract defines the conditional auth gate pattern. The boundary is: all 4 cart actions + `initiateCheckout` become dual-mode; `/order/result`, middleware, and Clerk webhooks remain unchanged.
- [x] CHK002 — Are there requirements preventing a guest from accessing authenticated-only cart data? [Gap, Spec §Assumptions] → Resolved: Accepted risk per Clarifications Q4. Square order IDs are non-sequential random strings. Cart data is low-sensitivity (product names, quantities, prices — no PII). Explicitly documented in assumptions as an MVP tradeoff.
- [ ] CHK003 — Is the auth-to-guest cart transfer (FR-009) specified with sufficient safeguards — does the system verify that the guest order being transferred does NOT already belong to a different authenticated user? [Gap, Spec §FR-009] → NOTE: The spec and research describe the transfer process (update order.customerId) but do not include a check for "is this guest order already claimed by someone else?" This is a defense-in-depth gap.
- [ ] CHK004 — Are requirements defined for what happens when a guest with a cart signs out (if they were signed in briefly) — does a new guest cart session start, or is the authenticated cart exposed via cookie? [Coverage, Gap] → NOTE: The edge cases cover "simultaneous guest and authenticated carts" but not the sign-out transition specifically. What happens to the auth session cookie vs guest cookie after sign-out?

## Cookie & Session Security

- [x] CHK005 — Is the accepted risk of unsigned guest cookies (cookie tampering) documented explicitly in the spec, with a clear statement that this is an MVP tradeoff? [Clarity, Spec §Assumptions] → Resolved: Assumptions section states "The guest cart cookie stores a raw Square order ID without cryptographic signing in the MVP. This risk is accepted for MVP and may be hardened in a future iteration."
- [x] CHK006 — Are the cookie properties (HttpOnly, SameSite, Secure, Path, maxAge) specified as requirements or are they left as implementation details? [Clarity, Research §3, Contracts §guest-cart-cookie] → Resolved: Contracts/guest-cart-cookie.md specifies HttpOnly: true, SameSite: Lax, Secure: in production, Path: /, maxAge: 604800 (7 days). These are explicit contract requirements.
- [x] CHK007 — Is the cookie clearance timing (after payment link creation, per FR-010) sufficient to prevent a guest from reusing a spent cart cookie to initiate a duplicate checkout? [Consistency, Spec §FR-010, Spec §FR-004] → Resolved: FR-010 clears the cookie before redirect. Once cleared, `getGuestCartOrderId()` returns null. The idempotency key (FR-004) provides a second defense layer against duplicate payment links.
- [x] CHK008 — Does the spec address what happens when a guest clears browser storage/cookies mid-session — is the behavior defined (empty cart) or left unspecified? [Coverage, Spec §Edge Cases] → Resolved: Edge case explicitly states "If the visitor clears them, the cart is lost. This is expected behavior for a guest — the store shows an empty cart state."

## Data Isolation

- [x] CHK009 — Are guest cart orders explicitly required to have NO `customerId` field set, ensuring they cannot be mixed up with authenticated orders in Square? [Clarity, Research §2, Data Model §Validation Rules] → Resolved: Data model validation rule #2 states "Guest cart orders must NOT have a customerId set (guards against auth cart mix-up)." Research §2 confirms Square supports `customerId` as optional on order creation.
- [x] CHK010 — Is the cart transfer process (guest → authenticated) specified to update the existing order's `customerId` rather than create a new order — avoiding orphaned guest orders? [Clarity, Spec §FR-009, Research §4] → Resolved: Research §4 specifies "Update the guest order: ordersApi.update({ orderId, order: { customerId: squareCustomerId, ... } })." Data model says "guest order's customerId is updated, not a new order created."
- [x] CHK011 — Are requirements defined for what prevents a guest's completed order (made before sign-in) from being retroactively linked to a different authenticated user's account? [Gap, Spec §Edge Cases] → Resolved: Spec assumptions state "No guest-to-account order linking is performed automatically. Guest orders completed before sign-in are not retroactively associated with an account." Edge case confirms "The completed guest order is not automatically linked to the newly authenticated account."
- [ ] CHK012 — Does the spec define whether the guest cart badge count (FR-015) exposes any authenticated user data when both paths coexist in the same header component? [Gap, Spec §FR-015] → NOTE: FR-015 says "display the guest cart item count in the header navigation cart badge" but doesn't explicitly state that guest and auth data must not be mixed. The implementation would naturally check auth() first and use the appropriate path, but this isn't spelled out as a requirement.

## Checkout Security

- [x] CHK013 — Is the guest checkout flow (FR-004) specified to use the same Square Payment Links API without exposing Square credentials — is the security posture identical to the authenticated path? [Consistency, Spec §FR-004, Spec §FR-013] → Resolved: Plan Constitution Check confirms "Guest checkout reuses same server actions — auth gate becomes conditional, not removed. Square token stays server-side. Payment link still generated server-side." FR-013 requires "same grace and cart preservation."
- [x] CHK014 — Does the spec or plan require that guest checkout payment links are created without pre-populated buyer data, and is this consistent with the decision that Square handles email collection? [Consistency, Clarifications §Q1] → Resolved: Clarification Q1 states "Square handles email collection on its hosted payment page; no email collection required on the store side for guests." No prePopulatedData needed in the payment link.
- [x] CHK015 — Are requirements defined for preventing order ID enumeration — can a guest guess or iterate through `orderId` values in the cookie to discover other guests' carts? [Gap, Spec §Assumptions] → Resolved: Same as CHK002/CHK005 — explicitly accepted MVP risk. Square order IDs are non-sequential random strings per the assumptions.

## Regression & Coexistence

- [x] CHK016 — Is FR-014 ("existing authenticated behavior unchanged") sufficiently testable — are there specific criteria for what constitutes a regression vs acceptable change? [Measurability, Spec §FR-014, Spec §SC-005] → Resolved: SC-005 states "The existing authenticated cart and checkout flow continues to work without regression — all existing cart and checkout tests pass unchanged." T028 adds an explicit regression integration test. The criterion is: existing test suite passes.
- [ ] CHK017 — Are requirements defined for the scenario where Clerk middleware injects an auth session but the user browses as if guest — is the system required to treat the user as authenticated when a session exists? [Gap, Spec §Edge Cases] → NOTE: The spec defines "unauthenticated visitor" as someone without an auth session. If Clerk middleware provides a valid userId (returning visitor), the code naturally uses the authenticated path. The spec doesn't address whether this is the desired behavior or if there should be an explicit "Continue as Guest" option.
- [x] CHK018 — Are the server action auth gates specified clearly for the transition case — guest starts checkout as guest, signs in mid-session, then submits the cart form — which path takes precedence? [Coverage, Gap] → Resolved: US3 handles this via cart transfer on sign-in. When sign-in occurs, the guest cookie is transferred to the authenticated cart and the cookie is cleared. Any subsequent form submission uses the authenticated path since auth() returns userId.

## Error Handling Parity

- [x] CHK019 — Does FR-013 ("same grace and cart preservation as authenticated checkout flow") explicitly cover all error modes — network failures, Square API errors, invalid order states — or is it a blanket reference that needs enumeration? [Clarity, Spec §FR-013] → Resolved: FR-013 is a reference to the existing authenticated error handling (024-checkout-flow FR-006) which defines two categories: temporary (5xx, retry) and permanent (4xx, specific action). The guest path inherits the same categories. This is a valid cross-reference, not a gap.
- [ ] CHK020 — Are requirements specified for what happens when Square rejects a guest payment link because the order was already converted (double-submit or race condition) — does the error handling distinguish this from a generic failure? [Coverage, Gap, Spec §FR-006] → NOTE: The idempotency key (FR-004) and button disable (FR-008 of 024-checkout-flow) are the primary defenses. But the spec doesn't explicitly describe the guest-specific double-submit error message. The Square API would return an error, which would be caught by generic error handling, but not distinguished as "duplicate checkout."

---

## Notes

- Items marked `[x]` are resolved with traceable references to spec, plan, research, or contracts
- 5 items remain open (CHK003, CHK004, CHK012, CHK017, CHK020) — all are LOW severity defense-in-depth gaps or edge cases, none are blocking for MVP
- CHK003 (transfer ownership check) and CHK004 (sign-out behavior) are the most significant remaining gaps
