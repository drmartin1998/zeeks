# Research: SDK-Only Product Fetching

**Feature**: 007-sdk-product-fetching
**Date**: 2026-08-01

## 1. Square SDK v45 Catalog API Patterns

**Decision**: Use `catalogApi.searchItems()` (cursor-paginated) for product listings and `catalogApi.search()` for category lookups. Continue using the existing `getSquareProductsByCategorySlug()` pattern as the base but move it into a Route Handler.

**Rationale**:
- The `square` npm package v45.0.1 is already installed and working in the codebase.
- `catalogApi.searchItems()` supports `categoryIds`, `enabledLocationIds`, and cursor-based pagination — already proven in `lib/square/catalog.ts`.
- `catalogApi.search()` with `objectTypes: ["CATEGORY"]` is already proven for categories.
- No need to switch to REST API or a different SDK version.

**Alternatives considered**:
- Direct REST API calls with `fetch()` — rejected because the SDK provides type safety, auth handling, and simpler error types.
- Square GraphQL API — rejected because it requires separate authentication setup and has limited catalog query support compared to the SDK.

## 2. Route Handler Architecture for SDK Calls

**Decision**: Create new Route Handlers under `app/api/catalog/` that call the Square SDK directly, then have Server Components `fetch()` these endpoints. The existing `lib/square/client.ts` stays as the SDK initialization point for Route Handlers only.

**Rationale**:
- Constitution Principle II mandates ALL Square API communication flow through Route Handlers.
- Route Handlers are the centralized chokepoint for: Zod validation (FR-008), retry logic (FR-005), caching headers (FR-007), and error formatting (FR-004).
- Server Components using `fetch()` to local Route Handlers benefit from Next.js's built-in request deduplication and cache.
- This pattern is already proven by `app/api/catalog/categories/route.ts`.

**Alternatives considered**:
- Keep direct SDK calls in Server Components — rejected because it violates Constitution II and scatters validation/retry/caching logic across multiple files.
- tRPC — rejected as unnecessary overhead; Route Handlers are native to Next.js and sufficient for this use case.

## 3. Zod Validation Strategy

**Decision**: Define Zod schemas in `lib/square/types.ts` for SDK response shapes and validate at Route Handler entry/exit points. Use `.safeParse()` for validation with typed error responses on failure.

**Rationale**:
- Constitution III mandates Zod validation of all external inputs.
- FR-008 requires validation before passing data to components.
- Square SDK responses are well-structured but not guaranteed at runtime (network errors, API version changes).
- `.safeParse()` pattern is already used in `lib/env.ts`.

**Schema design**:
- `CategoryObjectSchema` — validates `CatalogObject` with `type: "CATEGORY"`
- `ItemObjectSchema` — validates `CatalogObject` with `type: "ITEM"`
- `CatalogSearchResponseSchema` — validates the paginated search response wrapper
- `ProductSchema` — validates the transformed application-level product shape

**Alternatives considered**:
- Type assertions only (`as` casts) — rejected; provides zero runtime safety.
- io-ts — rejected; Zod is already in use and specified in the constitution.

## 4. Retry Logic with Exponential Backoff

**Decision**: Implement a shared `withRetry()` utility in `lib/utils.ts` that wraps SDK calls with configurable max retries (3), base delay (500ms), and exponential backoff (2x). Only retry on transient errors (network timeouts, 429 rate limit, 5xx).

**Rationale**:
- FR-005 requires retry logic with exponential backoff.
- Square API rate limits are 10 requests/second for search endpoints.
- Jitter should be added to avoid thundering herd on recovery.
- Non-transient errors (401, 403, 400) should NOT be retried.

**Alternatives considered**:
- `p-retry` npm package — rejected; adds dependency for a simple 20-line utility.
- No retry logic — rejected; violates FR-005.

## 5. Server-Side Caching

**Decision**: Use Next.js `cache()` for per-request deduplication within a single render pass, and `Cache-Control` response headers (`s-maxage`, `stale-while-revalidate`) for CDN/browser caching. Add explicit `revalidate` for ISR on category product listing pages.

**Rationale**:
- FR-007 requires server-side caching to reduce redundant Square API calls.
- Constitution IV specifies Vercel Edge Config or KV for catalog data cache.
- `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` pattern is already proven on the categories endpoint.
- ISR `revalidate` on category pages ensures fresh data within a configurable window.
- Square catalog changes are infrequent (minutes to hours), making 1-hour cache TTL appropriate.

**Alternatives considered**:
- Vercel KV for full catalog caching — possible future enhancement but adds complexity and cost for the initial implementation.
- `unstable_cache` — deprecated in favor of `cache()` and ISR.

## 6. Mock Data Cleanup Strategy

**Decision**: Mark `lib/data.ts` as deprecated with JSDoc `@deprecated` tags. Move `lib/data/products.ts` to test-only status. Ensure zero production pages import from `@/lib/data` (direct module) or `@/lib/data/products`.

**Rationale**:
- FR-002 and FR-003 require zero mock data imports in production.
- Current audit shows NO production pages import from `@/lib/data` directly (confirmed via `grep`).
- `lib/data/categories.ts` does import `catalogApi` directly (violation of FR-010) but its only consumer is `app/shop/[category]/page.tsx`.
- The `Category` and `Product` interfaces in `lib/data.ts` may be referenced by component prop types — these should be consolidated into `lib/square/types.ts`.
- MSW test handlers may import mock data for integration tests — this is permitted by spec assumptions.

**Alternatives considered**:
- Delete `lib/data/` entirely — rejected; may break test infrastructure that references these modules.
- Runtime guard — rejected; adds unnecessary complexity when a grep/lint rule is sufficient.
