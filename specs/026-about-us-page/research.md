# Research: About Us Page

**Feature**: 026-about-us-page
**Date**: 2026-08-04

## Research Tasks

### 1. Existing Design Patterns for Informational Pages

**Decision**: Follow the `CategoryHero` pattern for the page header and the home page pattern for layout structure.

**Rationale**:
- `CategoryHero` provides a dark header with breadcrumbs, headline, and description — exactly what the About page needs for the "Our Story" header.
- The home page (`app/page.tsx`) establishes the standard page structure: `<div>` wrapper → `<main>` content → `<Footer />`.
- The `NavBarServer` is already in the root layout — no need to add it to the About page.

**Alternatives considered**:
- Creating a new reusable `PageHero` component: Over-engineering for a single static page. Better to inline or reuse CategoryHero.
- Using `HeroSection` pattern: Too tall (600px) and includes CTA buttons that don't fit the About narrative.

### 2. Footer Link Fix Approach

**Decision**: Change the `href` value in the `FOOTER_LINKS` object and update the `Link` component's `href` prop.

**Rationale**:
- The `FOOTER_LINKS.Company` array contains `["About Us"]` — the link rendering maps each string to `<Link href="#">`.
- The cleanest fix is to modify the link rendering to use a proper URL mapping, or simply change the hardcoded `href="#"` to conditionally resolve based on the link label.
- Examining the footer code (line 57): `href="#"` is hardcoded for ALL links. The simplest, smallest change is to add a URL map and use it.

**Alternatives considered**:
- Changing FOOTER_LINKS from `string[]` to `{ label: string; href: string }[]`: More thorough but larger diff. The quick fix (url map) is sufficient.
- Waiting for a separate footer fix task: The footer "About Us" link is dead and this feature makes it live. Fixing it here prevents an orphaned feature.

### 3. Content Presentation

**Decision**: Section-based layout with:
1. Hero header ("Our Story" with "About us" subtitle)
2. Story section (founding paragraph)
3. Specialties section (product types paragraph)
4. Store info section (address)
5. CTA section ("Browse Our Products" button linking to `/shop`)

**Rationale**:
- Source content naturally breaks into these 4 sections.
- Each section is visually distinct with heading + body pattern.
- CTA at the end converts readers into shoppers.

**Alternatives considered**:
- Single continuous text block: Harder to scan; doesn't highlight the address or specialties.
- Cards for each product type: Overly complex for what is essentially a paragraph.

### 4. Typography and Color Conventions

**Decision**: Follow existing token usage:
- Headlines: `font-heading` (Outfit), `text-status-sale` (gold) for hero headline
- Body text: `text-white/80` on dark backgrounds, `text-text-primary` on light backgrounds
- Section headers: `font-heading text-2xl font-bold` 
- Address: `text-text-muted` or bordered card style for visual distinction
- Containers: `max-w-[1440px]` with `px-4 md:px-8 lg:px-20`

**Rationale**: These values are used consistently across the codebase (CategoryHero, hero-section, promo-banner, etc.).

### 5. Responsive Design

**Decision**: Use existing responsive patterns:
- `px-4 md:px-8 lg:px-20` for horizontal padding
- `text-[32px] md:text-[44px]` for hero headline sizing
- Stack content vertically on all viewports (natural for text-heavy pages)
- `max-w-[1440px]` container with `mx-auto` for centering

**Rationale**: These patterns are established in CategoryHero, footer, and other components. No new responsive breakpoints needed.

## Summary

No unknowns remain. All technical decisions are resolved by following existing patterns. The feature is a straightforward static page with a one-line footer fix.
