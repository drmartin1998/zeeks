# Feature Specification: Guest Loyalty Prompt on Checkout

**Feature Branch**: `029-guest-loyalty-prompt`

**Created**: 2026-08-06

**Status**: Draft

**Input**: User description: "as a guest I want to checkout without logging in. As a guest I want to see a notification that I can register or sign-in to start accumulating points or redeem existing rewawrds on the checkout page."

## Clarifications

### Session 2026-08-06

- Q: When the Square loyalty API check on checkout page load is slow (but not failing), should the system wait, show without notification, or render with a timeout? → A: Show the checkout page immediately without the notification; the API check runs in background but the page does not wait for it.
- Q: What level of screen reader accessibility should the loyalty notification provide — keyboard-only, announce-only, both, or none? → A: Both — screen reader announcement via live region (`role="status"`) AND keyboard-operable dismiss button (Tab + Enter/Space).
- Q: After a guest registers or signs in via the loyalty notification, how should the system ensure they return to the checkout page? → A: Notification links include a `return_to` query parameter (e.g., `/sign-in?return_to=/checkout`); the auth pages redirect back to that URL after completion.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Sees Loyalty Prompt on Checkout (Priority: P1)

An unauthenticated visitor reaches the checkout page with items in their cart. They see a non-blocking notification banner that informs them about the loyalty program benefits: registering or signing in lets them start accumulating points on purchases and/or redeem existing loyalty rewards. The notification does not block or prevent the guest from completing their purchase as a guest.

**Why this priority**: This is the core deliverable — the loyalty incentive notification for guests. All guest checkout mechanics already exist; this feature adds only the notification layer that encourages account creation and repeat business through the loyalty program.

**Independent Test**: As an unauthenticated visitor, add items to cart, proceed to checkout. Verify a loyalty prompt notification is visible on the checkout page. Complete checkout as a guest without interacting with the notification. Verify the notification does not block the checkout flow.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor on the checkout page with a non-empty cart, **When** the checkout page loads, **Then** a notification banner is displayed above or within the order summary area with a message about earning loyalty points and/or redeeming rewards by registering or signing in
2. **Given** an unauthenticated visitor viewing the loyalty notification on the checkout page, **When** they complete checkout as a guest (pay without signing in/registering), **Then** the checkout proceeds normally without interruption — the notification is informational and does not block payment
3. **Given** an unauthenticated visitor viewing the loyalty notification, **When** they dismiss or close the notification, **Then** the notification is removed from the checkout page for the remainder of that session
4. **Given** a returning guest who previously dismissed the notification in the same browser session, **When** they reach the checkout page again, **Then** the notification does not reappear (dismissal persists per browser session)

---

### User Story 2 - Guest Clicks "Register" from Loyalty Prompt (Priority: P2)

An unauthenticated visitor on the checkout page clicks the "Register" call-to-action within the loyalty notification. They are taken to a registration page. After completing registration, they are returned to the checkout page where they are now authenticated, their guest cart has been transferred, and they can see their loyalty points balance and available rewards (if any).

**Why this priority**: The conversion path — turning a guest into a registered customer through the loyalty incentive. This drives account creation, which enables loyalty program participation and repeat purchases.

**Independent Test**: As a guest on the checkout page, click the "Register" button in the loyalty prompt. Complete registration. Verify return to checkout page as an authenticated customer with cart items intact.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor on the checkout page with the loyalty notification displayed, **When** they click a "Register" button within the notification, **Then** they are navigated to the registration page and the guest cart state is preserved
2. **Given** a guest who clicked "Register" from the loyalty notification and completed registration, **When** they return to the checkout page, **Then** they are authenticated, their guest cart items are transferred to their account cart, and the loyalty notification is replaced by the authenticated customer checkout experience (including loyalty points and reward selection if applicable)
3. **Given** a guest who clicks "Register" but abandons the registration flow (closes tab, navigates back), **When** they return to the checkout page, **Then** they are still unauthenticated, their guest cart is preserved, and the loyalty notification remains visible

---

### User Story 3 - Guest Clicks "Sign In" from Loyalty Prompt (Priority: P2)

An unauthenticated visitor on the checkout page clicks the "Sign In" call-to-action within the loyalty notification. They are taken to the sign-in page. After signing in, they are returned to the checkout page where they are authenticated, their guest cart has been merged with their existing cart (if any), and they can see their loyalty points balance and available rewards.

**Why this priority**: Equal importance to registration — captures returning customers who may not realize their loyalty benefits are tied to their account. Converting a signed-in session unlocks loyalty rewards that can increase order value.

**Independent Test**: As a guest on the checkout page, click "Sign In" in the loyalty prompt. Sign in with an existing account that has loyalty points. Verify return to checkout as authenticated with loyalty info displayed.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor on the checkout page with the loyalty notification displayed, **When** they click a "Sign In" button within the notification, **Then** they are navigated to the sign-in page and the guest cart state is preserved
2. **Given** a guest who clicked "Sign In" and completed authentication, **When** they return to the checkout page, **Then** they are authenticated, their guest cart items are transferred to their account cart (merged with existing items if any), and the loyalty notification is replaced by the authenticated checkout experience
3. **Given** a signed-in customer on the checkout page, **When** the checkout page renders, **Then** the loyalty notification for guests is NOT displayed — the authenticated checkout experience shows instead

---

### Edge Cases

- **Guest cart is empty but guest navigates to checkout anyway**: The checkout page redirects to the cart page with an "empty cart" message. The loyalty notification is not relevant in this state.
- **Guest dismisses notification then signs in later in the same session**: After sign-in, the notification is no longer relevant (user is authenticated). The authenticated checkout experience displays normally.
- **Guest with a loyalty account who is not signed in**: The notification still shows the generic prompt about earning points and redeeming rewards. The prompt does not reference a specific loyalty account since the guest is unauthenticated. After sign-in, the system detects the loyalty account and displays rewards.
- **Loyalty program is not configured (no SQUARE_LOYALTY_PROGRAM_ID)**: The loyalty notification is not displayed. The checkout page functions normally for guests without the prompt. This avoids showing a broken incentive path.
- **Square loyalty API is unreachable at the time the notification would render**: The notification is hidden rather than risking a broken registration/sign-in incentive that the guest cannot follow through on.
- **Square loyalty API is slow to respond (but responsive)**: The checkout page renders immediately without the notification. The API check is not waited on — the page never delays checkout rendering for a loyalty API response. If the API eventually responds, the next navigation or page load may show the notification if all other conditions are met.
- **Guest already has a Clerk session but the session is expired**: If the guest attempts to sign in and the session refresh fails, they remain on the checkout page as a guest with the notification still visible.
- **Guest uses browser back button after signing in via the notification**: They return to the checkout page as authenticated. The notification is gone; the authenticated checkout experience shows.
- **return_to parameter is missing or invalid after authentication**: The auth pages redirect the authenticated customer to a default page (e.g., account dashboard) rather than the checkout page. The guest cart items are still transferred to their account. The customer can manually navigate back to `/checkout` to continue.
- **Notification on mobile viewports**: The notification must render correctly and remain dismissible at all viewport sizes (mobile, tablet, desktop).
- **Multiple browser tabs**: If the guest dismisses the notification in one tab and opens checkout in a second tab, the notification does not appear in the second tab (dismissal is per-session, which spans tabs within the same browser session).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a loyalty incentive notification on the checkout page when the visitor is unauthenticated (guest) and has a non-empty cart
- **FR-002**: The notification MUST inform guests that by registering or signing in they can (a) start accumulating loyalty points on purchases and (b) redeem existing loyalty rewards they may have
- **FR-003**: The notification MUST include two distinct call-to-action buttons: "Register" (linking to the registration page) and "Sign In" (linking to the sign-in page)
- **FR-004**: The notification MUST be non-blocking — the checkout payment flow MUST remain fully functional for guests whether or not they interact with the notification
- **FR-005**: System MUST allow the guest to dismiss (close) the notification, and the dismissal MUST persist for the remainder of the browser session
- **FR-006**: System MUST NOT display the loyalty notification when the loyalty program is not configured (no `SQUARE_LOYALTY_PROGRAM_ID` environment variable)
- **FR-007**: System MUST NOT display the loyalty notification when the Square loyalty API is unreachable or slow to respond at checkout page load time. The checkout page MUST NOT delay its render waiting for the loyalty API — the page renders immediately without the notification if the API has not yet responded
- **FR-008**: System MUST NOT display the loyalty notification for authenticated customers — the authenticated checkout experience (including loyalty panel and reward selection per 027-rewards-redemption and 028-custom-checkout) MUST render instead
- **FR-009**: When a guest clicks "Register" from the notification, system MUST navigate to the registration page with a `return_to` query parameter set to the checkout page URL, while preserving the guest cart state
- **FR-010**: When a guest clicks "Sign In" from the notification, system MUST navigate to the sign-in page with a `return_to` query parameter set to the checkout page URL, while preserving the guest cart state
- **FR-011**: After successful registration or sign-in initiated from the notification, system MUST transfer guest cart items to the authenticated cart (as specified in 025-guest-checkout FR-009) and show the authenticated checkout experience
- **FR-012**: System MUST render the notification as part of the checkout page's initial server-rendered HTML (RSC) — the notification content and its visibility decision are determined server-side based on the auth state at request time, not revealed after hydration
- **FR-013**: The notification MUST be responsive and correctly rendered at all viewport sizes (mobile down to 375px, tablet 768px, desktop 1280px)
- **FR-014**: The notification MUST be announced to screen readers as a live region (`role="status"`) when it appears on page load, and the dismiss button MUST be keyboard-operable (focusable via Tab, activatable via Enter/Space)

### Key Entities

- **Loyalty Notification**: A non-blocking informational banner displayed on the checkout page for unauthenticated visitors. Contains a message about loyalty benefits (earning points, redeeming rewards) and two calls-to-action (Register, Sign In). Dismissible per browser session. Not shown to authenticated customers or when loyalty program is unavailable.
- **Guest Cart State Preservation**: During registration or sign-in initiated from the notification, the guest's cart (items, quantities) is preserved and transferred to the authenticated account upon completion. This relies on the cart transfer mechanism defined in 025-guest-checkout.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of unauthenticated visitors on the checkout page with a non-empty cart and a configured loyalty program see the loyalty notification
- **SC-002**: The notification does not block or delay the guest checkout payment flow — guests can complete payment without interacting with the notification
- **SC-003**: Guests who dismiss the notification do not see it again in the same browser session on subsequent checkout page visits
- **SC-004**: Authenticated customers never see the guest loyalty notification on the checkout page — the authenticated experience renders instead
- **SC-005**: The notification is not rendered when the loyalty program is not configured or the API is unreachable, and the checkout page degrades gracefully without it
- **SC-006**: Guest cart items survive the round-trip through registration or sign-in initiated from the notification (100% cart preservation rate)

## Assumptions

- Guest checkout on the custom checkout page already functions per 025-guest-checkout and 028-custom-checkout. This feature adds only the loyalty notification layer on top.
- The loyalty program (016-loyalty-enrollment) and rewards redemption (027-rewards-redemption) features are implemented and available for authenticated customers.
- The registration page, sign-in page, and Clerk authentication flow are established (014-clerk-sign-in, 017-custom-auth-forms). The notification links to existing pages — no new registration or sign-in flows are created by this feature.
- Guest cart transfer on sign-in is implemented per 025-guest-checkout FR-009 and US3. This feature relies on the existing transfer mechanism.
- The checkout page URL path is the custom checkout page established by 028-custom-checkout.
- The notification dismissal state is stored in the browser session (cookie or sessionStorage) — server-side persistence is out of scope.
- The notification is informational and non-intrusive by design. It does not use popups, modals, or overlays that would interrupt the checkout flow.
- The loyalty program availability check (`SQUARE_LOYALTY_PROGRAM_ID` env var) is done server-side. If the program is not configured, the notification is omitted from the initial HTML — no client-side flicker or hide-after-load.
- The Square loyalty API reachability check is lightweight (e.g., a simple status or list call during checkout page render). If it fails or is slow, the notification is omitted server-side to avoid a broken incentive path — the checkout page never waits for this response.
