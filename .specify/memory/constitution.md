<!--
  === SYNC IMPACT REPORT ===
  Version change: 1.0.0 → 1.1.0 (added Branching Strategy gate)
  Principles:
    - Created: I. Server Components First
    - Created: II. API Route Security (Square API)
    - Created: III. Type-Safe Data Flow
    - Created: IV. Vercel-Native Performance
    - Created: V. Progressive Enhancement
    - Created: VI. Gherkin-First Testing
    - Created: VII. Environment-Driven Configuration
  Sections:
    - Created: Technology Stack
    - Created: Development Workflow & Quality Gates
    - Added: Branching Strategy (MANDATORY) gate under Development Workflow
  Templates requiring updates:
    - .specify/templates/plan-template.md    ⚠ pending
    - .specify/templates/spec-template.md     ⚠ pending
    - .specify/templates/tasks-template.md    ⚠ pending
    - git/SKILL.md                           ✅ aligned (branch safety rules)
  Follow-up TODOs:
    - None. All placeholders filled.
-->

# Zeeks Constitution

## Core Principles

### I. Server Components First

All pages and data-fetching logic MUST execute on the server via React Server
Components (RSC). Client Components (`"use client"`) are permitted ONLY at leaf
nodes where interactivity, browser APIs, or React hooks are required. Every
feature MUST justify any `"use client"` directive. Server Actions MUST be used
for form submissions, cart mutations, and checkout flows — never client-side
fetch directly to Square APIs. Data fetching for products, categories, and
inventory MUST happen in Server Components using `async`/`await` with Square
API server-side SDK calls routed through Next.js Route Handlers.

**Rationale**: Keeps Square credentials server-side, reduces client JS bundle
size, improves SEO and First Contentful Paint (FCP), and aligns with Vercel's
streaming/partial-prerendering architecture.

### II. API Route Security (Square API)

All Square API communication MUST flow through Next.js Route Handlers
(`app/api/**/route.ts`). The Square access token MUST NEVER be exposed to the
browser. Route Handlers MUST validate input with Zod schemas before forwarding
requests to Square. Every Route Handler MUST return typed responses and handle
Square API errors gracefully, returning appropriate HTTP status codes and
user-facing error messages. Rate limiting and request idempotency keys MUST be
implemented for all mutating Square operations (payments, orders, catalog
updates).

**Rationale**: Square API credentials (`SQUARE_ACCESS_TOKEN`,
`SQUARE_LOCATION_ID`) are server-only secrets. Exposing them client-side
constitutes a critical security breach. Server-side proxying also enables
caching, request coalescing, and circuit-breaker patterns.

### III. Type-Safe Data Flow

TypeScript strict mode is NON-NEGOTIABLE. Every Square API response type MUST
have an explicit interface defined in `lib/square/types.ts`. Product, Category,
Cart, Order, and Customer models MUST be centralized and shared between Route
Handlers and components. Zod schemas MUST validate all external inputs
(API routes, Server Actions, search params). The `@/*` path alias MUST be used
for all imports — no relative import paths beyond same-directory sibling files.
API response types MUST be narrow (exact fields used) rather than wide
(passthrough of Square SDK types).

**Rationale**: Square's API surface is large and version-dependent. Typed
interfaces prevent drift between Square's responses and the UI, catch breaking
changes at compile time, and serve as living documentation for the integration.

### IV. Vercel-Native Performance

The application MUST target "green" Core Web Vitals on Vercel Analytics. Static
pages (home, category landing, about) MUST use `export const dynamic =
"force-static"` or `generateStaticParams`. Semi-dynamic pages (product listings,
search) MUST use Incremental Static Regeneration (ISR) with `revalidate` values
tuned to catalog update frequency. Dynamic pages (cart, checkout, account) MUST
use Streaming Server Rendering with `<Suspense>` boundaries. All images MUST use
`next/image` with explicit `width`/`height` and `blurDataURL` placeholders.
Fonts MUST use `next/font` with `subset` and `display: swap`. The Vercel
Edge Config or KV store MUST cache Square API responses for catalog data.

**Rationale**: eCommerce conversion rates are directly correlated with page load
speed. Vercel's edge infrastructure provides CDN, ISR, and streaming — all of
which MUST be leveraged to keep Time to First Byte (TTFB) under 200ms and
Largest Contentful Paint (LCP) under 2.5s.

### V. Progressive Enhancement

The core shopping flow (browse → view product → add to cart → checkout) MUST
function without JavaScript. Forms MUST use native `<form>` elements with
Server Actions as the `action` prop. Navigation MUST use `<Link>` components
that produce real `<a href>` tags. Cart state MUST persist via server-side
session cookies, not client-side localStorage. Interactive enhancements
(search-as-you-type, optimistic cart updates, image zoom) MUST layer on top
of the baseline HTML experience. When the Square API is unreachable, the
application MUST degrade gracefully with cached data and clear user messaging.

**Rationale**: Hobby-gaming customers span diverse devices and network
conditions. Progressive enhancement ensures the store is usable on slow
connections, older browsers, and with assistive technologies. It also improves
resilience against Square API outages.

### VI. Gherkin-First Testing

Every user story MUST have a corresponding Gherkin `.feature` file in
`specs/<feature>/features/<feature-slug>.feature` BEFORE any implementation
code is written. This is enforced by the spec-kit Gherkin extension (hooks:
`after_specify`, `before_implement`). Tests MUST be organized in three layers:

- **Unit tests** (Vitest): Pure logic — Zod schemas, utility functions, data
  transformations, price calculations. No Square API calls.
- **Integration tests** (Vitest + MSW): Route Handlers with mocked Square API
  responses. Verify request shaping, error handling, and response
  transformation.
- **E2E tests** (Playwright): Critical user journeys against Vercel Preview
  Deployments. Verify the full stack works with Square Sandbox.

Test files MUST be co-located with their target: `__tests__/` alongside the
module under test. E2E tests live in `tests/e2e/`.

**Rationale**: Square API integration is the highest-risk surface. Mocked
integration tests catch request/response mismatches before deployment.
Gherkin scenarios ensure business stakeholders can read and validate
acceptance criteria.

### VII. Environment-Driven Configuration

All configuration values (Square credentials, environment flags, feature
toggles) MUST come from environment variables validated at application startup
via Zod schemas. The `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`,
`SQUARE_APPLICATION_ID`, and `SQUARE_ENVIRONMENT` (sandbox/production) variables
MUST be validated in `lib/env.ts` before any Square client is initialized.
Production deployments on Vercel MUST use Vercel Environment Variables (never
committed `.env` files). The Square environment MUST default to `sandbox` in
development and `production` only when explicitly set with
`SQUARE_ENVIRONMENT=production`.

**Rationale**: Accidental production Square API calls during development can
create real transactions. Environment validation at startup provides a clear,
early failure with actionable messages rather than cryptic Square API errors.

## Technology Stack

| Concern | Technology | Version |
|---------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| Runtime | React Server Components | 19.x |
| Language | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS | 4.x |
| Component System | shadcn/ui (base-nova style) | latest |
| Variant Management | Class Variance Authority (CVA) | 0.7.x |
| Icons | Lucide React | 1.x |
| Form Validation | Zod | latest (add to deps) |
| Commerce Backend | Square API (Sandbox → Production) | 2025-01 |
| Deployment | Vercel (Pro) | — |
| Testing (Unit + Integration) | Vitest | latest (add to deps) |
| API Mocking | MSW (Mock Service Worker) | latest (add to deps) |
| E2E Testing | Playwright | latest (add to deps) |
| Caching | Vercel KV / Edge Config | — |

## Development Workflow & Quality Gates

### Gherkin-First Gate (MANDATORY)

1. Feature spec written via `/speckit-specify`
2. Gherkin `.feature` file auto-generated by `after_specify` hook
3. **HARD BLOCK**: No implementation without `.feature` file
4. `/speckit-plan` — architecture, research, data model
5. `/speckit-tasks` — task breakdown organized by user story
6. `/speckit-implement` — execution with Gherkin validation

### Code Quality Gates

- **TypeScript**: `tsc --noEmit` MUST pass with zero errors. No `as any`,
  `@ts-ignore`, or `@ts-expect-error` without a comment explaining why.
- **Linting**: ESLint MUST pass with zero warnings. The `eslint-config-next`
  preset MUST be used with no rule downgrades.
- **Formatting**: Prettier (add to devDependencies) MUST be configured as
  the single formatter.
- **Bundle Size**: No page route bundle MUST exceed 150 KB (uncompressed)
  for initial JS. Use `@next/bundle-analyzer` to verify.

### Branching Strategy (MANDATORY)

- **NEVER commit directly to `main`**. All work MUST happen on feature branches.
- Before starting ANY work, create a feature branch via
  `/speckit-specify` which auto-generates the branch from the feature spec.
- Branch naming MUST follow the spec-kit convention: `<###>-<short-name>`
  (e.g., `001-checkout-flow`, `042-product-search`).
- Feature branches MUST be created from an up-to-date `main`. Run
  `git pull --rebase origin main` before branching.
- Merges to `main` MUST go through a Pull Request with at least one review.
- After merge, the feature branch MUST be deleted.

### Vercel Deployment Gates

- **Preview Deployments**: Every PR MUST create a Vercel Preview Deployment.
  E2E tests MUST run against the preview URL before merge.
- **Production**: Merges to `main` MUST deploy to Vercel Production.
  Square environment MUST be `production` only in the Production deployment.
- **Rollback**: Vercel's instant rollback MUST be verified after every
  production deployment.

### Constitution Compliance

Every implementation plan (`plan.md`) MUST include a Constitution Check
section that verifies compliance with all 7 principles. Any violation
MUST be documented in the Complexity Tracking table with justification.

## Governance

This constitution supersedes all other development practices, conventions,
and guidelines for the Zeeks project. Amendments MUST follow this process:

1. Propose the amendment with rationale in a PR
2. Update `.specify/memory/constitution.md` (this file)
3. Bump the version following semver (MAJOR for removed/changed principles,
   MINOR for new principles or sections, PATCH for clarifications)
4. Update all dependent templates (plan, spec, tasks) to reflect changes
5. Obtain approval from project maintainer before merge

All code reviews MUST verify compliance with the Core Principles. Any
principle violation MUST be explicitly justified and documented in the
PR description.

**Version**: 1.1.0 | **Ratified**: 2026-08-01 | **Last Amended**: 2026-08-01
