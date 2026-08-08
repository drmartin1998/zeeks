# Quickstart Validation: VIP Program Page

**Branch**: `039-vip-program-page` | **Date**: 2026-08-08

This guide validates the VIP Program feature end-to-end. It references the [data model](./data-model.md) and [contracts](./contracts/vip-program-api.md) rather than duplicating them.

## Prerequisites

- Local dev server running via `vercel dev` (Constitution Rule 5). Check port 3000 is free first: `lsof -ti:3000`.
- Square sandbox credentials configured (validated in `lib/env.ts`).
- The Square catalog contains two `SUBSCRIPTION_PLAN` objects named "VIP Basic" and "VIP Premium".

## Setup

```bash
vercel dev        # mirrors production env (Square credentials)
```

## Validation Scenarios

### 1. Global navigation shows "VIP Program"

1. Load any page (e.g., `/`).
2. Confirm a "VIP Program" link appears in the global nav.
3. Click it → lands on `/vip-program`.

**Expected**: The nav link is present site-wide and navigates to the VIP page.

### 2. Page lists both subscription tiers

1. On `/vip-program`, scroll to the tier comparison.
2. Confirm "VIP Basic" and "VIP Premium" cards render with their name, price, and benefits.

**Expected**: Both tiers, sourced live from Square, are displayed.

### 3. Purchase flows through checkout

1. Activate a tier's purchase action.
2. Complete the existing checkout flow (card-on-file).
3. Confirm a subscription is created in Square for the customer against the selected plan.

**Expected**: The purchase routes through the existing custom checkout and creates the subscription.

### 4. Error/empty state on data failure

1. Temporarily remove the subscription plans (or simulate a Square API failure).
2. Load `/vip-program`.

**Expected**: The tier comparison shows a graceful error/empty state; no hardcoded/mock tiers are rendered.

## Automated Checks

Run the project quality gates (from `.clinerules` / Constitution):

```bash
tsc --noEmit        # TypeScript passes
npm run lint        # ESLint 0 errors
npm test            # Vitest suites pass
npm run test:e2e    # Playwright critical paths pass
```

## Related

- Contracts: [vip-program-api.md](./contracts/vip-program-api.md)
- Data model: [data-model.md](./data-model.md)
- Feature spec: [spec.md](./spec.md)