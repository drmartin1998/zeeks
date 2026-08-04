# Feature Specification: About Us Page

**Feature Branch**: `026-about-us-page`
**Created**: 2026-08-04
**Status**: Draft
**Input**: "create an about us page that uses the existing design system with the content located here https://www.zeekscomicsandgames.com/about"

## Clarifications

### Session 2026-08-04

- Q: What specific content from the Square Online About page should be included? → A: Content provided manually from the rendered page (see Content Reference below).
- Q: What section headings, CTA label/destination, and visual treatment should be used? → A: Section headings are "Our Story" (hero), "What We Offer" (specialties), "Visit Us" (address). CTA is "Browse Our Products" linking to `/shop`. Hero follows the `CategoryHero` pattern (dark bg, gold headline, 240px height). Address is visually distinct via a bordered card on light background.
- Q: What accessibility standards apply? → A: WCAG 2.1 AA — contrast ratios of 4.5:1 (body) and 3:1 (large text), sequential heading levels (h1 → h2), keyboard-focusable CTA with visible focus ring. Address uses semantic `<address>` element. Page includes `<title>` and `<meta name="description">` for SEO.
- Q: Are operating hours and phone number needed? → A: Omitted — the source page doesn't include them. No placeholder text or "coming soon" message is displayed.

## Content Reference

The following text is the source content from `https://www.zeekscomicsandgames.com/about`:

**Headline**: "Our Story"
**Subheadline**: "About us"
**Body**:

> Zeek's Comics and Games opened late summer of 2015. For the past 10 Years we have been an innovative, engaging and growing community of nerdy customers, fans and family.
>
> At Zeek's we specialize in New Comics, Miniature War Gaming, Role-playing Games, Card Games and more! We strive to offer you customer service, selection and flexibility for all of your hobby and nerdy related needs.

**Store Address**:

> Zeeks Comics and Games
> 30 Cherry Tree Shopping Center, Suite A4, Washington, IL 61571

*Note: The source page does not include operating hours or a phone number.*

## User Scenarios & Testing

### User Story 1 - Learn About the Store (Priority: P1)

As a visitor to the Zeeks website, I want to read about the store's story, mission, and what makes it unique so that I can decide whether to visit or shop.

**Why this priority**: The About page is a core trust-building page. It helps convert first-time visitors into customers by establishing credibility and connection.

**Independent Test**: Navigate to `/about`, verify the page loads with the store's story, founding details, and product specialties displayed in a readable, branded layout consistent with the rest of the site.

**Acceptance Scenarios**:

1. **Given** a visitor on the Zeeks website, **When** they click "About Us" in the navigation or footer, **Then** they are taken to `/about` and see a branded page with the "Our Story" headline and store narrative.
2. **Given** the About page is displayed, **When** the visitor reads the content, **Then** they learn that Zeeks opened in summer 2015, has been serving the community for 10 years, and specializes in new comics, miniature war gaming, role-playing games, and card games.
3. **Given** the About page is displayed, **When** viewed on mobile, tablet, or desktop, **Then** the content is readable and the layout adapts appropriately.

---

### User Story 2 - Find Store Information (Priority: P2)

As a potential customer, I want to find practical information about the store — such as location, what products are sold, and how to visit — so that I can plan a trip or know what to expect when shopping online.

**Why this priority**: Practical store info complements the narrative content and drives foot traffic and online sales.

**Independent Test**: View the About page and verify the store's physical address and product categories are displayed in an easily scannable format.

**Acceptance Scenarios**:

1. **Given** a visitor viewing the About page, **When** they look for store details, **Then** they see the store's physical address: "30 Cherry Tree Shopping Center, Suite A4, Washington, IL 61571".
2. **Given** a visitor viewing the About page, **When** they want to know what Zeeks sells, **Then** they see the product specialties: new comics, miniature war gaming, role-playing games, and card games.
3. **Given** the About page displays the store address, **When** a visitor views it, **Then** the address is formatted clearly and is visually distinct from the narrative content.

---

### User Story 3 - Navigate from About Page (Priority: P3)

As a visitor who has read the About page, I want clear calls-to-action to explore products or find the store so that I can take the next step.

**Why this priority**: The About page should be a gateway to further engagement, not a dead end.

**Independent Test**: From the About page, verify that at least one CTA button or link directs to the shop or a relevant page.

**Acceptance Scenarios**:

1. **Given** a visitor on the About page, **When** they reach the end of the content or the store info section, **Then** they see at least one call-to-action (e.g., "Browse Our Products", "Shop Now") that links to the store's shopping page or a relevant category.

---

### Edge Cases

- **Footer "About Us" link is dead**: The footer component (`components/footer.tsx`) currently has "About Us" with `href="#"`. This must be updated to `href="/about"`.
- **Navigation already links to `/about`**: The site navigation already includes an "About Us" link pointing to `/about`. No navigation changes are needed.
- **No operating hours on source page**: The source content does not include store hours. The About page omits this information entirely — no placeholder text, no "coming soon" message. Can be added later if provided.
- **No phone number on source page**: The source content does not include a contact phone number. Same approach as hours — omitted entirely until content is provided.

## Requirements

### Functional Requirements

- **FR-001**: The page MUST exist at the `/about` route and be accessible from the nav bar "About Us" link and the footer "About Us" link.
- **FR-002**: The footer "About Us" link MUST be updated from `href="#"` to `href="/about"`.
- **FR-003**: The page MUST use the existing design system per the conventions in `globals.css`: `--font-heading` (Outfit) for headlines, `--font-sans` (Inter) for body text, `max-w-[1440px]` container with `px-4 md:px-8 lg:px-20` responsive padding, `text-text-primary` on light backgrounds, `text-white/80` on dark backgrounds.
- **FR-004**: The page MUST include a header/hero section with a dark background (`bg-neutral-900`), breadcrumb navigation (Home → About Us), the "Our Story" headline in `font-heading` with `text-status-sale` (gold), and the "About us" subheadline. Height: 240px (matching `CategoryHero`).
- **FR-005**: The page MUST display the store's founding narrative paragraph: "Zeek's Comics and Games opened late summer of 2015. For the past 10 Years we have been an innovative, engaging and growing community of nerdy customers, fans and family." under the "Our Story" banner.
- **FR-006**: The page MUST display the store's product specialties under a "What We Offer" section heading: "At Zeek's we specialize in New Comics, Miniature War Gaming, Role-playing Games, Card Games and more! We strive to offer you customer service, selection and flexibility for all of your hobby and nerdy related needs."
- **FR-007**: The page MUST display the store's physical address under a "Visit Us" section heading, using a semantic `<address>` element. The address block MUST be visually distinct from narrative text (bordered card or muted background): "30 Cherry Tree Shopping Center, Suite A4, Washington, IL 61571". Store name "Zeeks Comics and Games" MUST appear with the address.
- **FR-008**: The page MUST include a "Browse Our Products" primary button (gold, using the existing `<Button>` component) linking to `/shop`, placed at the end of the content.
- **FR-009**: The page MUST render the existing `<Footer />` component below the content, following the same pattern as `app/page.tsx`.
- **FR-010**: The page MUST be responsive and readable on mobile (375px+), tablet (768px+), and desktop (1440px) viewports with no horizontal scrolling and readable font sizes (minimum 16px body text).
- **FR-011**: The page MUST use proper heading hierarchy: a single `<h1>` ("Our Story"), `<h2>` for "What We Offer" and "Visit Us" sections, with no skipped heading levels.
- **FR-012**: The page MUST include an HTML `<title>` ("About Us — Zeeks Comics and Games") and `<meta name="description">` ("Learn about Zeeks Comics and Games — your local store for new comics, miniature war gaming, role-playing games, and card games in Washington, IL since 2015.") for SEO.
- **FR-013**: All interactive elements (CTA button, links) MUST have visible keyboard focus indicators. Color contrast MUST meet WCAG 2.1 AA minimums (4.5:1 for body text, 3:1 for large text).

### Key Entities

- **About Page Content**: Static content consisting of the store's founding story, product specialties, and physical address. This is not fetched from an API — it is static text embedded in the page. No database or external service is needed.

## Success Criteria

- **SC-001**: Visitors can reach the About page from both the nav bar and footer in a single click.
- **SC-002**: The About page displays the store's story, product specialties, and address using the specified section structure ("Our Story" → "What We Offer" → "Visit Us" → CTA) with the defined visual treatments.
- **SC-003**: The page loads and renders within 2 seconds on a standard broadband connection (10 Mbps).
- **SC-004**: The page meets WCAG 2.1 AA accessibility standards: heading hierarchy (h1 → h2 with no skipped levels), color contrast (4.5:1 body / 3:1 large text), keyboard-navigable links and button with visible focus indicators, and semantic `<address>` markup.
- **SC-005**: Users on mobile devices (375px viewport width minimum) can read all content without horizontal scrolling or zooming. Body text renders at minimum 16px.

## Assumptions

- The nav bar "About Us" link already exists and points to `/about`. No nav bar changes are needed.
- The footer "About Us" link currently points to `#`. This must be updated as part of FR-002.
- The store address is hardcoded as static text on the About page. It is not pulled from the Square Locations API for this feature.
- No operating hours or phone number are included, as the source page does not provide them.
- No new API endpoints, database tables, or third-party services are needed — this is a static informational page.
- No decorative images are used at this time — the source page does not reference any hero or storefront imagery.
- The page does not require authentication — it is publicly accessible to all visitors.
- The `CategoryHero` component pattern (`components/product-listing/category-hero.tsx`) is the visual reference for the hero header: dark background, breadcrumbs, gold headline, 240px height, `max-w-[1440px]` container.
