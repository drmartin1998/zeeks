# Implementation Plan: Checkout Fulfillment Options

**Branch**: `038-checkout-fulfillment-options` | **Date**: 2026-08-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/038-checkout-fulfillment-options/spec.md`

## Summary

Add a fulfillment selection (shipping or pickup) as an inline section on the checkout page, above the payment form. When the customer chooses shipping, a shipping-address form appears (with a "same as billing" option), and a shipping cost is calculated from the order subtotal using tiered rates. When pickup is chosen, no address is required and pickup details are used. The chosen fulfillment method and (for shipping) the address are stored with the order, and the order confirmation page and order-confirmation email reflect the fulfillment method (shipping address, or store location + hours + "ready for pickup" note).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: Next.js 16.x (App Router), Square SDK 45.x, Zod, Resend (email, via feature 037), Tailwind CSS 4

**Storage**: N/A — Square Orders API is the sole data source; fulfillment is stored on the Square order

**Testing**: Vitest + @testing-library/react + user-event + MSW (integration for checkout components, unit for shipping-cost calc), Playwright (optional E2E)

**Target Platform**: Vercel (serverless), modern evergreen browsers

**Project Type**: Next.js App Router web application (single project, `@/*` path alias)

**Performance Goals**: Fulfillment selection and shipping-cost display are client-side instant (<100ms); no extra network round-trips beyond existing checkout

**Constraints**: Square order data MUST flow through the Square SDK server-side (Constitution II); zero mock data in production (Constitution VII); server components first with `"use client"` only at interactive leaf nodes (Constitution I); shipping cost is a pure calculation (testable)

**Scale/Scope**: Checkout page (`app/checkout/`), 2 new/updated client components (fulfillment section + shipping address form), order model extension (`Cart` + fulfillment), shipping-cost util, confirmation page update, email update (depends on feature 037), 11 functional requirements, 10 Gherkin scenarios

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | ✅ PASS | Checkout remains a server component; only the fulfillment section and shipping-address form are `"use client"` leaf components. |
| II | API Route Security | ✅ PASS | Fulfillment stored on the Square order via the Square SDK server-side (in the existing payment/order server action). No new tokens exposed. |
| III | Type-Safe Data Flow | ✅ PASS | `FulfillmentMethod`, `ShippingAddress`, and `Cart` fulfillment extension typed in `lib/square/types.ts`; Zod validates the shipping-address form; `@/*` imports. |
| IV | Component Architecture | ✅ PASS | New `FulfillmentSection` and `ShippingAddressForm` client components using Tailwind + `cn()`, consistent with existing checkout components. |
| V | Performance & Caching | ✅ PASS | Shipping-cost calculation is a pure client-side function; no new network calls. |
| VI | Gherkin-First Testing (Testing Trophy) | ✅ PASS | `.feature` file exists (10 scenarios). Integration tests for the fulfillment section (RTL + user-event); unit tests for the shipping-cost calc. |
| VII | No Mock Data Fallback | ✅ PASS | Fulfillment and addresses come from the customer's input + Square order; no fabricated data. |

## Project Structure

### Documentation (this feature)

```text
specs/038-checkout-fulfillment-options/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
├── features/
│   └── checkout-fulfillment-options.feature   # Gherkin scenarios (10)
└── checklists/
    └── requirements.md              # Quality checklist
```

### Source Code (repository root) — key files

```text
app/checkout/page.tsx                    # US1: render the fulfillment section above the payment form
components/checkout/checkout-page-client.tsx  # US1: mount FulfillmentSection + pass fulfillment state
components/checkout/fulfillment-section.tsx   # NEW "use client": shipping/pickup toggle (US1)
components/checkout/shipping-address-form.tsx # NEW "use client": shipping address + same-as-billing (US2)
lib/square/types.ts                    # ADD: FulfillmentMethod, ShippingAddress; extend Cart
lib/checkout/shipping-cost.ts          # NEW: pure calculateShippingCost(subtotal) tiered util (US1/FR-010)
app/cart/actions.ts                    # US1/US2: persist fulfillment + shipping cost on the order (server action)
app/order/confirmation/page.tsx        # US3: show fulfillment method + address/pickup details
lib/email/...                          # US3: extend order-confirmation email (depends on feature 037)
```

**Structure Decision**: Single Next.js App Router project. The fulfillment section is a client component mounted above the payment form; it owns the shipping/pickup state and the shipping-address form. Shipping cost is a pure function (`calculateShippingCost`) so it is unit-testable. On submit, the existing payment server action persists the fulfillment details and shipping cost on the Square order; the confirmation page and email read them back to display the fulfillment method.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. The shipping-cost tier table is a small pure constant + function; the fulfillment state is contained in two leaf client components.