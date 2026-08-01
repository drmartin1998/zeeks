<!--
  === SYNC IMPACT REPORT ===
  Version change: 1.1.0 → 1.2.0 (expanded Principle VI to Testing Trophy, added Testing Quality Gates)
  Principles:
    - Updated: VI. Gherkin-First Testing → VI. Gherkin-First Testing (Testing Trophy)
      Expanded with Kent C. Dodds' Testing Trophy layers, anti-patterns, and coverage strategy
  Sections:
    - Updated: Technology Stack (added @testing-library/react, user-event, jsdom)
    - Added: Testing Quality Gates (static, unit+integration, E2E, Gherkin coverage, no CI skips)
  New files:
    - tests/SKILL.md — comprehensive testing skill with examples and configuration
  Templates requiring updates:
    - .specify/templates/tasks-template.md    ✅ updating next
    - .specify/templates/plan-template.md     ⚠ pending
    - .specify/templates/spec-template.md     ⚠ pending
  Follow-up TODOs:
    - Install vitest, @testing-library/react, @testing-library/user-event,
      @testing-library/jest-dom, msw, jsdom, @vitejs/plugin-react, @playwright/test
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

### VI. Gherkin-First Testing (Testing Trophy)

Every user story MUST have a corresponding Gherkin `.feature` file in
`specs/<feature>/features/<feature-slug>.feature` BEFORE any implementation
code is written. This is enforced by the spec-kit Gherkin extension (hooks:
`after_specify`, `before_implement`).

Tests follow the **Testing Trophy** (Kent C. Dodds) — invest proportionally
across four layers, ordered by investment size:

| Layer | Tool | Investment | What to test |
|-------|------|-----------|--------------|
| **Static** | TypeScript, ESLint | Foundation (every line) | Type safety, lint rules, accessibility hints |
| **Unit** | Vitest | Medium | Zod schemas, pure utilities, data transforms |
| **Integration** | Vitest + RTL + MSW | **LARGEST** | Components + Route Handlers + Server Actions |
| **E2E** | Playwright | Small (few, critical) | Checkout, search, auth user journeys |

Core principles from Kent C. Dodds:

- **Test behavior, not implementation details.** Query by role/text/label,
  not by state, props, or internal method names. If a refactor doesn't break
  tests, the tests are good.
- **Mock at the network boundary.** Use MSW to intercept `fetch` — never
  mock child components (`vi.mock("./Child")`), modules, or hooks.
- **Integration tests give the most confidence per effort.** The bulk of
  test investment lives here. Render full component trees, exercise Route
  Handlers end-to-end, test Server Actions from form submissions.
- **`getByRole` first, `getByTestId` last.** Prefer accessible queries
  that mirror how users and assistive technologies find elements.
- **No snapshot tests.** They're brittle, low-signal, and discourage
  intentional refactoring. Use explicit assertions.
- **Coverage is a signal, not a target.** Don't chase 100%. Focus coverage
  on critical paths: checkout, pricing, Square API integration.

Test files MUST be co-located with their target: `__tests__/` alongside the
module under test. E2E tests live in `tests/e2e/`. Setup files in
`tests/setup/`.

**Rationale**: Square API integration is the highest-risk surface. The
Testing Trophy ensures high confidence on the integration boundary without
over-investing in brittle unit tests. Gherkin scenarios ensure business
stakeholders can read and validate acceptance criteria while developers
map them directly to integration and E2E tests.

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
| Unit + Integration Testing | Vitest | latest (add to deps) |
| Component Testing | @testing-library/react + user-event | latest (add to deps) |
| API Mocking | MSW (Mock Service Worker) | latest (add to deps) |
| E2E Testing | Playwright | latest (add to deps) |
| Deployment | Vercel (Pro) | — |
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

### Testing Quality Gates

- **Static**: `tsc --noEmit` and `npm run lint` MUST pass before ANY test run.
  These are the foundation of the Testing Trophy.
- **Unit + Integration**: `npm test` (vitest run) MUST pass with zero failures
  before merge. Tests MUST follow the Testing Trophy: query by role, mock at
  the network boundary (MSW), test behavior not implementation details.
- **E2E**: `npm run test:e2e` MUST pass against the Vercel Preview Deployment
  URL before merge to `main`. At minimum, the happy-path checkout journey
  MUST be covered.
- **Gherkin Coverage**: Every `@US{N}` scenario in the `.feature` file
  MUST have at least one corresponding integration or E2E test that
  exercises the acceptance criteria.
- **No skipped tests in CI**: `it.skip` and `test.skip` are permitted in
  local development only. CI MUST run all tests.

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

**Version**: 1.2.0 | **Ratified**: 2026-08-01 | **Last Amended**: 2026-08-01
