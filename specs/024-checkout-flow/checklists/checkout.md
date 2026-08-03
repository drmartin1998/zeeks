# Requirements Quality Checklist: Square Checkout Flow

**Purpose**: Validate requirements completeness, clarity, and consistency before peer review
**Created**: 2026-08-03
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md)
**Audience**: Peer review gate (PR)
**Depth**: Standard — includes transactional integrity, security boundary, and scenario coverage

---

## Requirement Completeness

- [x] CHK001 - Are requirements defined for the checkout button's visual states (enabled, disabled, loading) beyond the single mention in FR-008? [Completeness, Spec §FR-001, §FR-002, §FR-008] → Resolved: FR-001 now specifies "visually active and functionally enabled"; FR-002 specifies "visually grayed out AND non-interactive"; FR-008 specifies "replace button with spinner + text"
- [x] CHK002 - Is idempotency specified as a requirement for payment link creation to prevent duplicate checkouts? [Gap, Spec §FR-004] → Resolved: FR-004 now requires "unique idempotency key per checkout attempt"
- [x] CHK003 - Are requirements specified for what happens when a customer clicks "back" in the browser after being redirected to the Square payment page? [Gap, Scenario Coverage] → Resolved: Added edge case "Customer clicks browser 'back' after being redirected to Square"
- [x] CHK004 - Are accessibility requirements specified for the checkout button (focus state, ARIA label, keyboard activation)? [Gap, Spec §FR-001] → Resolved: Added FR-013 requiring aria-label and keyboard activation (Enter/Space)
- [x] CHK005 - Is the loading indicator described in FR-008 specified with enough detail — visual form, placement, and duration behavior? [Clarity, Spec §FR-008] → Resolved: FR-008 now specifies "spinner with accompanying 'Redirecting to checkout...' text" and "disable button on first click"
- [x] CHK006 - Are requirements defined for what the confirmation page displays when the order detail fetch fails after return from Square? [Gap, Spec §FR-010] → Resolved: FR-010 now specifies fallback: "display the transaction ID and a 'View Orders' link without crashing"
- [x] CHK007 - Are requirements specified for the cancellation page when Square redirect parameters are missing or malformed? [Gap, Edge Case, Spec §FR-011] → Resolved: Added US3 Scenario 3 for missing/unrecognized status — shows generic "View Orders" link

## Requirement Clarity

- [x] CHK008 - Is "disabled" in FR-002 specified with enough detail — does it mean visually grayed out, non-interactive, or both? [Clarity, Spec §FR-002] → Resolved: FR-002 now states "both visually grayed out AND non-interactive (ignores click, tap, and keyboard activation events)"
- [x] CHK009 - Is the error message content in FR-006 specified — what specific information should error messages convey vs. what should remain generic? [Clarity, Spec §FR-006] → Resolved: FR-006 now distinguishes temporary failures ("Please try again") from permanent issues (specific action required)
- [x] CHK010 - Is "order confirmation page" in FR-010 specified with the required elements — beyond "order number and summary of items," what else must be present? [Clarity, Spec §FR-010] → Resolved: FR-010 now specifies transaction ID, item summary list, "Continue Shopping" link, and fallback behavior
- [x] CHK011 - Is "preserved for retry" in FR-011 specified with enough detail — does it mean the exact same cart, or a new cart with the same items? [Ambiguity, Spec §FR-011] → Resolved: FR-011 now states "The exact same draft order (same order ID) remains available"
- [x] CHK012 - Is the return URL format in FR-009 specified — what base URL, what path, and what query parameters are expected? [Clarity, Spec §FR-009] → Resolved: FR-009 now specifies `/order/result` path and `VERCEL_URL` as base URL source

## Requirement Consistency

- [x] CHK013 - Do the checkout button state requirements (FR-001 enabled, FR-002 disabled) remain consistent with the loading state in FR-008 — is the button disabled during loading, or replaced with a spinner? [Consistency, Spec §FR-001, §FR-002, §FR-008] → Resolved: FR-008 now specifies "replace the 'Checkout' button with a loading indicator" — consistent three-state model: enabled → disabled + message → replaced with spinner
- [x] CHK014 - Are the edge case "cart items preserved for another checkout attempt" (Edge Cases §5) and FR-011's "cart items preserved for retry" describing the same behavior? If so, are they consistent in wording? [Consistency, Spec Edge Cases, §FR-011] → Resolved: Both now consistently describe the exact same draft order remaining unchanged
- [x] CHK015 - Does the plan's research.md state "DRAFT→OPEN transition handled by Square internally" while FR-003 states "MUST convert draft order to a pending order" — are these consistent, or does one imply the store performs the conversion? [Conflict, Spec §FR-003, research.md §2] → Resolved: FR-003 updated to "Square handles the DRAFT-to-OPEN state transition internally when the payment link is created"

## Acceptance Criteria Quality

- [x] CHK016 - Is SC-001 ("redirected within 5 seconds") measured from button click or from server action invocation? The distinction matters for client-side vs. server-side timing. [Measurability, Spec §SC-001] → Resolved: SC-001 now specifies "measured from button click to browser navigation to the Square URL"
- [x] CHK017 - Can SC-002 ("100% of successful checkouts display the correct order total") be verified without access to Square's payment page rendering? The payment page is Square-hosted. [Measurability, Spec §SC-002] → Resolved: SC-002 now specifies verification by "comparing the cart subtotal at checkout time to the order total passed to Square's API, both observable server-side"
- [x] CHK018 - Is SC-005 ("zero false enables") measurable — what constitutes a "false enable," and how would it be detected? [Measurability, Spec §SC-005] → Resolved: SC-005 now defines "zero instances where an unavailable-item cart shows an active checkout button"
- [x] CHK019 - Are acceptance scenarios for US2 (error handling) sufficiently testable — "Square API returns an error" covers many failure modes; should specific error classes be distinguished? [Measurability, Spec US2 Scenario 1] → Resolved: US2 now has separate scenarios for 5xx (temporary, retry) and 4xx (permanent, specific message) errors

## Scenario Coverage

- [x] CHK020 - Is the "customer double-clicks checkout button" scenario addressed in requirements? [Gap, Exception Flow] → Resolved: Added edge case "Customer double-clicks the 'Checkout' button" — button disabled immediately on first click
- [x] CHK021 - Are requirements defined for the scenario where the cart is modified (items added/removed) while the checkout server action is in-flight? [Gap, Concurrent Access] → Resolved: Already covered by edge case "Cart state changes between checkout initiation and payment" — new changes go to new draft order
- [x] CHK022 - Are requirements specified for the scenario where the Square payment link URL itself is inaccessible or returns an error after the redirect? [Gap, Exception Flow, Spec §FR-005] → Resolved: Added edge case "Square payment link URL is inaccessible after redirect" — this is a Square availability issue, not the store's responsibility
- [x] CHK023 - Is the scenario where authentication expires between cart page load and checkout button click addressed? [Gap, Auth Expiry, Spec §FR-012] → Resolved: Added edge case "Authentication expires during checkout" and US2 Scenario 4, plus FR-012 now covers session expiry
- [x] CHK024 - Are requirements defined for the scenario where a customer completes payment but the return redirect fails (network error, server down)? [Gap, Recovery Flow, Spec Edge Cases §1] → Resolved: Already covered by edge case §1 — "order confirmation is accessible via order history"

## Edge Case Coverage

- [x] CHK025 - Does the spec define what happens when the payment link expiry period passes but the customer is still on the Square payment page entering details — is there a timeout requirement? [Gap, Edge Case, Spec Edge Cases §2] → Resolved: Updated edge case §2 — "they see Square's default expiry page. A new checkout attempt generates a fresh payment link with a new idempotency key"
- [x] CHK026 - Are requirements specified for the scenario where the order total changes between payment link creation and payment completion (e.g., price update from Square catalog)? [Gap, Edge Case, Spec Edge Cases §3] → Resolved: Edge case §3 covers this — line items are locked at payment link creation time
- [x] CHK027 - Is the "customer has multiple pending orders from abandoned checkouts" scenario addressed with cleanup or expiration requirements? [Gap, Spec Edge Cases §4] → Resolved: Updated edge case §4 — "Abandoned pending orders remain in Square but do not affect the current cart." Square handles payment link expiry; no store-side cleanup needed

## Non-Functional Requirements

- [x] CHK028 - Are security boundary requirements explicitly specified — what cardholder data does the store NEVER touch, and where is the boundary between store logic and Square's PCI scope? [Gap, Security, Plan §Technical Context] → Resolved: Added FR-014 — "System MUST never collect, store, or transmit cardholder data. All payment data collection is handled exclusively by Square"
- [x] CHK029 - Is the datastore for the return page's order confirmation specified — does it re-fetch from Square API, rely on query parameters, or use a server-side cache? [Gap, Data Integrity, Spec §FR-010] → Resolved: Updated FR-010 and Key Entities — displays query parameter data; optional Square API enrichment; falls back gracefully without API call
- [x] CHK030 - Are performance requirements specified for the checkout initiation beyond "5 seconds to redirect" — what about Time to First Byte for the order result page under SC-004's 3-second target? [Completeness, Spec §SC-001, §SC-004] → Resolved: SC-004 covers result page timing; added timeout edge case for API calls exceeding 10 seconds

## Dependencies & Assumptions

- [x] CHK031 - Is the assumption "Square Checkout API is available in sandbox and production" validated or documented as an environment dependency with fallback behavior? [Assumption, Spec Assumptions §3] → Resolved: Updated assumption to include fallback: "If the Square API is unreachable or returns errors, the checkout flow displays an error message on the cart page with cart preserved"
- [x] CHK032 - Is the assumption "tax and shipping calculations are handled by Square" verified — does Square's payment link API actually compute these, or must they be pre-set on the order? [Assumption, Spec Assumptions §8] → Resolved: Updated assumption — "The Square Payment Links API configures tax and shipping calculations on the Square-hosted payment page based on the order total and location settings. The store does not compute or display tax/shipping on the cart page."

---

## Summary

| Category | Items | Status |
|----------|-------|--------|
| Requirement Completeness | CHK001–CHK007 | ✅ All resolved |
| Requirement Clarity | CHK008–CHK012 | ✅ All resolved |
| Requirement Consistency | CHK013–CHK015 | ✅ All resolved |
| Acceptance Criteria Quality | CHK016–CHK019 | ✅ All resolved |
| Scenario Coverage | CHK020–CHK024 | ✅ All resolved |
| Edge Case Coverage | CHK025–CHK027 | ✅ All resolved |
| Non-Functional Requirements | CHK028–CHK030 | ✅ All resolved |
| Dependencies & Assumptions | CHK031–CHK032 | ✅ All resolved |

**All 32 items resolved.** Key spec changes:
- Added 2 new FRs: FR-013 (accessibility) and FR-014 (security/PCI boundary)
- Updated FR-003 to reflect Square's internal DRAFT→OPEN transition
- Added idempotency key requirement to FR-004
- Clarified button states: enabled/disabled/loading as distinct states
- Added 5 new edge cases: double-click, browser back, auth expiry, payment link inaccessible, API timeout
- All success criteria now specify measurement methodology
- Assumptions now include fallback behavior for Square API unavailability
