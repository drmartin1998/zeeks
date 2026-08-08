# Research: VIP Program Page

**Branch**: `039-vip-program-page` | **Date**: 2026-08-08

## 1. Listing subscription tiers from Square

- **Decision**: Fetch the two VIP tiers as Square catalog objects of type `SUBSCRIPTION_PLAN` via `catalogApi.search({ objectTypes: ["SUBSCRIPTION_PLAN"] })`, executed server-side in an async Server Component. Map each plan to a presentation type (name, price, benefits) and pass it to the tier comparison UI.
- **Rationale**: Square stores subscription plans as catalog objects (`SUBSCRIPTION_PLAN`), not via the Subscriptions API's `search` (which returns individual customer subscriptions, not available plans). The catalog search pattern matches the existing `fetchAllCategories()` in `lib/square/catalog.ts`, so it reuses established code and keeps the token server-side (Constitution II). The page is data-driven: exactly the plans configured in Square ("VIP Basic", "VIP Premium") render.
- **Alternatives considered**: (1) The Subscriptions API `subscriptionsApi.search` — rejected because it lists customer subscriptions, not the purchasable plans. (2) Hardcoding the two tiers — rejected by the No-Mock-Data rule; the page must reflect Square's live catalog and show an error/empty state when data is unavailable.

## 2. Getting plan price and benefits

- **Decision**: Read each `SUBSCRIPTION_PLAN` catalog object's `subscriptionPlanData.name` and `subscriptionPlanData.subscriptionPlanVariations` (price per billing period) for the price; present the benefits/descriptive copy as static design content because Square subscription plans do not carry a rich free-form benefits list.
- **Rationale**: Square's `SUBSCRIPTION_PLAN` exposes structured name + pricing variations but not a variable-length benefits list. The Figma design shows a specific benefits list per tier. Keeping name and price data-driven while presenting benefits as static, design-matched copy gives accurate pricing with presentational marketing content.
- **Alternatives considered**: Attempting to source the benefits list from Square custom attributes — rejected as over-engineering; the design copy is stable marketing content.

## 3. Purchase mechanism (card-on-file)

- **Decision**: Reuse the existing custom web-checkout flow with a saved card (card-on-file). The purchase action for each tier routes the shopper into the existing checkout, which processes the subscription against Square.
- **Rationale**: Chosen via clarification (Option B). Reusing the established checkout Server Action + Square payment flow avoids building a new payment mechanism and keeps card handling server-side (Constitution II).
- **Alternatives considered**: (1) Square-hosted checkout (payment link/invoice) — solid but introduces a separately hosted flow; declined in favor of reusing the existing custom checkout. (2) Deferring purchase to a later iteration — declined; purchase is a core P1 requirement.

## 4. Global navigation placement

- **Decision**: Add `{ label: "VIP Program", href: "/vip-program" }` to `STATIC_NAV_CATEGORIES` in `lib/data/categories.ts`.
- **Rationale**: The nav bar renders static informational links from this array (same as "About Us" and "Local Events"). `STATIC_NAV_CATEGORIES` is explicitly documented as NOT mock data (AGENTS.md Appendix D), so this is the sanctioned pattern. VIP Program is a static top-level link, not a Square-managed Shop category.
- **Alternatives considered**: Adding it as a Square catalog category — rejected; it is a static informational link, not a product category.

## 5. Page rendering strategy

- **Decision**: Build `/vip-program` as an async Server Component. Presentational sections (hero, VIP Weekends, FAQ) render from static design content; the tier comparison renders from the server-fetched subscription plans. The FAQ accordion is a small `"use client"` leaf.
- **Rationale**: Follows the Server-Components-First principle (Constitution I) and the existing `app/about` / `app/account` patterns. Static content is fast and SEO-friendly; only the tier data requires a server fetch.
- **Alternatives considered**: A fully client-rendered page — rejected; violates Server-Components-First and exposes fetch logic client-side.

## 6. Error and empty states

- **Decision**: When the subscription plan fetch fails or returns no matching plans, render a graceful error/empty state in the tier comparison area. Never substitute hardcoded or mock tiers.
- **Rationale**: Constitution VII and AGENTS.md Rule 2 (No Mock Data in Production) require graceful degradation with clear messaging rather than fabricated data.
- **Alternatives considered**: Falling back to hardcoded tier cards — rejected by the No-Mock-Data rule.