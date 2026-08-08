# Feature Specification: VIP Program Page

**Feature Branch**: `039-vip-program-page`

**Created**: 2026-08-08

**Status**: Draft

**Input**: User description: "there is a vip-program-page in Figma, use MCP to find it. Create a new VIP page that appears in the global nav VIP Program. It will list two subscriptions from square that can be purchased. VIP Basic item name is 'VIP Basic' and VIP Premium item name is 'VIP Premium'."

## Clarifications

### Session 2026-08-08

- Q: How should a shopper purchase a VIP subscription from the VIP Program page? → A: Reuse the existing custom web-checkout flow with a saved card (card-on-file).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover and reach the VIP Program page (Priority: P1)

A shopper browsing the store wants to learn about the VIP membership program. They see a "VIP Program" link in the global site navigation and click it to reach a dedicated VIP Program page that explains the program and its benefits.

**Why this priority**: Making the VIP Program discoverable from the global navigation is the entry point for the entire feature. Without a nav link, shoppers cannot find the page. This is the minimal slice that makes the feature reachable.

**Independent Test**: Can be fully tested by loading any page on the site, confirming a "VIP Program" link appears in the global navigation, and confirming it navigates to the VIP Program page.

**Acceptance Scenarios**:

1. **Given** a shopper is on any page of the site, **When** they view the global navigation, **Then** a "VIP Program" link is present.
2. **Given** a shopper sees the "VIP Program" link in the global navigation, **When** they click it, **Then** they are taken to the VIP Program page.

---

### User Story 2 - View the two VIP subscription tiers (Priority: P1)

A shopper on the VIP Program page wants to see the subscription options available for purchase. The page lists the two VIP membership tiers — "VIP Basic" and "VIP Premium" — each shown with its name, price, and benefits, pulled live from the store's Square catalog.

**Why this priority**: Listing the two purchasable subscriptions is the core content of the VIP page. The tiers are managed as Square catalog subscription plans, so the page presents them as they are configured in Square.

**Independent Test**: Can be fully tested by loading the VIP Program page and confirming that both the "VIP Basic" and "VIP Premium" subscription tiers are displayed with their pricing and benefits.

**Acceptance Scenarios**:

1. **Given** the store has two Square subscription plans named "VIP Basic" and "VIP Premium", **When** a shopper loads the VIP Program page, **Then** both tiers are displayed.
2. **Given** a shopper views the VIP Program page, **When** they look at the tier comparison, **Then** each tier shows its name, price, and list of benefits.
3. **Given** one of the two subscription plans is missing from the Square catalog, **When** the page loads, **Then** the page still shows the available tier(s) without breaking, and the missing tier is not fabricated or replaced with placeholder data.

---

### User Story 3 - Purchase a VIP subscription (Priority: P1)

A shopper decides to join a VIP tier. They select "VIP Basic" or "VIP Premium" on the VIP Program page and complete a purchase of the subscription, which is processed against Square.

**Why this priority**: Being able to actually purchase a subscription is the primary business outcome of the VIP Program. The page must surface a purchase action for each tier that leads to a working checkout.

**Independent Test**: Can be fully tested by selecting a tier's purchase action and completing the subscription purchase flow, confirming the subscription is created in Square.

**Acceptance Scenarios**:

1. **Given** a shopper is viewing a VIP tier, **When** they activate the purchase action for that tier, **Then** they are taken through a checkout flow to purchase the subscription.
2. **Given** a shopper completes the subscription purchase, **Then** a subscription is created against the selected plan in Square for the purchasing customer.

---

### User Story 4 - Read program information on the VIP page (Priority: P2)

A shopper wants to understand the program before committing. The VIP Program page presents the hero messaging, a tier comparison, a "VIP Weekends" benefits section, and a FAQ so the shopper can evaluate the program.

**Why this priority**: The informational content (hero, weekends, FAQ) supports conversion and is present in the design, but the page remains functional without it. It is secondary to discoverability and the core tier listing.

**Independent Test**: Can be fully tested by loading the VIP Program page and confirming the hero, tier comparison, VIP Weekends, and FAQ sections render with the design copy.

**Acceptance Scenarios**:

1. **Given** a shopper loads the VIP Program page, **When** they scroll through it, **Then** they see the hero, the tier comparison, the VIP Weekends section, and the FAQ.

---

### Edge Cases

- What happens when the Square catalog has no subscription plans, or none match the expected VIP tiers? The page should show a graceful empty/error state rather than fabricating tiers or hardcoding fallback data.
- What happens when the Square API is unavailable when the page loads? The page should degrade gracefully with a clear error/empty state, never substituting hardcoded or mock subscription data (Constitution VII / AGENTS.md No-Mock-Data rule).
- What happens when only one of the two tiers exists in Square? The page should render the available tier(s) and not invent the missing one.
- What happens when a shopper is not signed in when they attempt to purchase? The purchase flow should handle authentication, prompting sign-in as needed, consistent with the existing checkout behavior.
- What happens if a shopper attempts to purchase a tier they are already subscribed to? The purchase flow should handle duplicate/active subscriptions gracefully with a clear message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The global site navigation MUST include a "VIP Program" link that navigates to the VIP Program page.
- **FR-002**: The system MUST provide a VIP Program page at a dedicated route (e.g., `/vip-program`).
- **FR-003**: The VIP Program page MUST list the purchasable VIP subscription tiers retrieved live from the store's Square catalog. The primary tiers are "VIP Basic" and "VIP Premium".
- **FR-004**: Each listed tier MUST display its name, price, and benefits as configured in Square.
- **FR-005**: The VIP Program page MUST provide a purchase action for each listed tier that initiates a subscription purchase through the existing custom web-checkout flow, using a saved card (card-on-file) to create the subscription.
- **FR-006**: A completed subscription purchase MUST create a subscription in Square for the purchasing customer against the selected plan.
- **FR-007**: The VIP Program page MUST present the program's informational content, including a hero section, a tier comparison, a VIP Weekends benefits section, and a FAQ, matching the provided design.
- **FR-008**: When the VIP subscription data cannot be loaded (no plans, API failure, or a tier missing), the page MUST show a graceful error/empty state and MUST NOT substitute hardcoded or mock subscription data.

### Key Entities *(include if feature involves data)*

- **VIP Subscription Tier**: A purchasable membership level (e.g., "VIP Basic", "VIP Premium"). Each tier is a Square catalog subscription plan with a name, price, billing cadence, and list of benefits.
- **VIP Program Page**: The public page at `/vip-program` presenting the program's hero, tier comparison, VIP Weekends, and FAQ content.
- **Purchase Action**: The action on each tier that takes the shopper through checkout to create a subscription.
- **Subscription**: A Square subscription record created when a shopper purchases a tier, tied to the customer and the selected plan.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A shopper can reach the VIP Program page from the global navigation with a single click on any page of the site.
- **SC-002**: 100% of loadable VIP Program pages display every available subscription tier configured in the Square catalog (no tier is missing or replaced with fabricated data).
- **SC-003**: A shopper can initiate a purchase for either tier in under 3 clicks from the VIP Program page.
- **SC-004**: A completed purchase creates a subscription in Square for the correct customer and plan (verifiable via the Square dashboard).
- **SC-005**: When Square data is unavailable, the page shows a clear error/empty state and never renders hardcoded subscription tiers.

## Assumptions

- The two VIP tiers ("VIP Basic" and "VIP Premium") are configured as catalog objects of type `SUBSCRIPTION_PLAN` in the Square catalog, with names matching those strings.
- The VIP Program page is a public page reachable without signing in (informational), consistent with `app/about`; purchase actions route through the existing authenticated checkout flow.
- Subscription purchase reuses the existing custom web-checkout flow with a saved card (card-on-file) to create the subscription in Square, rather than a Square-hosted checkout or a new payment mechanism.
- The page follows the existing design system (Tailwind, shadcn/ui, the Figma `vip-program-page` layout) and the Server-Components-First convention (data fetched server-side via Square API, never exposed to the browser).
- Listing subscription plans uses the existing Square catalog search pattern with object type `SUBSCRIPTION_PLAN`.