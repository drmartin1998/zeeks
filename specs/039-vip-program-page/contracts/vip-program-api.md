# Contract: VIP Program Subscription Plans

**Branch**: `039-vip-program-page` | **Date**: 2026-08-08

## Overview

The VIP Program page needs the purchasable VIP subscription tiers. These are read from the Square catalog as `SUBSCRIPTION_PLAN` objects. The page fetches them server-side (async Server Component) and renders a tier card per plan.

## Data Source Contract

**Square API**: Catalog Search — `catalogApi.search({ objectTypes: ["SUBSCRIPTION_PLAN"], includeDeletedObjects: false })`

**Server-side module**: `lib/square/subscriptions.ts` exports a function (e.g., `getVipSubscriptionPlans()`) that:
1. Calls `catalogApi.search` for `SUBSCRIPTION_PLAN` objects.
2. Maps each plan to a `VipSubscriptionPlan` presentation type.
3. Filters to the known VIP tiers ("VIP Basic", "VIP Premium") by name.
4. Returns the list (or an empty list on no matches).

## Response Shape

```ts
interface VipSubscriptionPlan {
  id: string;
  name: string;          // e.g., "VIP Basic", "VIP Premium"
  priceCents: number;    // price for the billing cycle, in cents
  billingCadence: string; // e.g., "year"
  description: string;    // static design copy
  benefits: string[];     // static design copy
  purchaseActionLabel: string;
}
```

**Error handling**: On API failure or zero matching plans, the page shows a graceful error/empty state. No hardcoded/mock tiers are returned.

## Page Contract

- **Route**: `/vip-program` (async Server Component).
- **Nav**: "VIP Program" link → `/vip-program` (added to `STATIC_NAV_CATEGORIES`).
- **Sections**: Hero, Tier Comparison (from plans), VIP Weekends, FAQ.
- **Purchase**: Each tier card has a purchase action routing to the existing checkout flow (card-on-file).

## Related

- Data model: `data-model.md`
- Validation guide: `quickstart.md`
