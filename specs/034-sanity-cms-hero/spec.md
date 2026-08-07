# Feature Specification: Sanity CMS Hero

**Feature Branch**: `034-sanity-cms-hero`

**Created**: 2026-08-07

**Status**: Draft

**Input**: User description: "We are using sanity cms for content, the hero image should connect to sanity CMS to pull the content for it."

## Overview

The home page currently renders a hardcoded hero section (`components/hero-section.tsx`) with a static banner. The site uses Sanity CMS for content. The home page hero should fetch its content (badge/eyebrow, heading, subheading, background image, and both call-to-action buttons) from the Sanity `heroBlock` stored on the home page document (slug `/`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Render the hero from Sanity (Priority: P1)

A visitor to the home page sees the hero section with the badge, heading, subheading, background image, and both CTA buttons driven entirely by the content stored in the Sanity `heroBlock` for the home page. There is no hardcoded hero copy in the running site.

**Why this priority**: This is the core of the request — the hero becomes CMS-driven so content editors can update it without code changes.

**Independent Test**: Visit the home page and confirm the hero badge, heading, subheading, background image, and both CTA buttons render the values from the Sanity home page document (slug `/`).

**Acceptance Scenarios**:

1. **Given** the Sanity home page document has a `heroBlock`, **When** the home page is requested, **Then** the hero renders the eyebrow, heading, subheading, background image, and both CTA labels/hrefs from that block.
2. **Given** the hero has a background image asset in Sanity, **When** the hero renders, **Then** the background image is served from the Sanity image URL (not a local file).
3. **Given** editors update the heroBlock fields in Sanity, **When** the content is revalidated, **Then** the home page hero reflects the new values without a code deploy.

### User Story 2 - Graceful fallback when hero content is missing (Priority: P2)

If the Sanity home page document or its `heroBlock` is missing (or the image asset is unset), the home page still renders without errors — the hero falls back to sensible empty/neutral states rather than breaking or substituting mock data.

**Why this priority**: Aligns with the No-Mock-Data-In-Production rule — the hero must never substitute hardcoded fallback copy; on missing data it should degrade gracefully.

**Independent Test**: Temporarily remove the `heroBlock` (or its image) from the Sanity home page document and confirm the home page still renders without an error.

**Acceptance Scenarios**:

1. **Given** the home page document has no `heroBlock`, **When** the home page is requested, **Then** the hero renders with no content (or an empty/neutral hero) and does not throw or show mock copy.
2. **Given** the `heroBlock` has no background image asset, **When** the hero renders, **Then** the section keeps its neutral dark background and displays no broken image.

### Edge Cases

- What happens if Sanity is unreachable or the fetch fails? The page should not crash; show the existing empty/neutral hero state.
- What happens if only the image is missing but text exists? Text renders normally; background stays the neutral dark color.
- What happens if a CTA has no label or href? The button is omitted rather than rendering a dead link.
- How do CTA hrefs from Sanity map to routes? They are external URLs / slugs; rendered as links as provided by Sanity.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The home page hero MUST fetch its content from the Sanity `heroBlock` on the home page document (slug `/`).
- **FR-002**: The hero MUST render the eyebrow/badge, heading, subheading, background image, and both CTA buttons from the Sanity data.
- **FR-003**: The hero background image MUST be served from the Sanity image CDN URL, NOT the local static file.
- **FR-004**: When Sanity content changes, the rendered hero MUST update via Sanity's live content / revalidation mechanism.
- **FR-005**: When the home page document, `heroBlock`, or image is missing, the hero MUST render without errors (no mock data, no broken image).
- **FR-006**: Missing/unset CTA labels or hrefs MUST NOT render a dead/broken button.

### Key Entities *(include if feature involves data)*

- **HeroBlock** (Sanity): `_type: "heroBlock"` with `eyebrow`, `heading`, `subheading`, `image` (Sanity image asset), `primaryCta` (`link`), `secondaryCta` (`link`).
- **Page** (Sanity): document `_type: "page"`, slug `/`, containing `pageBuilder[]` of which the `heroBlock` is the first entry.
