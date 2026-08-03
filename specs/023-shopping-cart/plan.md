# Implementation Plan: Shopping Cart

**Branch**: `023-shopping-cart` | **Date**: 2026-08-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/023-shopping-cart/spec.md`

## Summary

Make the existing "Add to Cart" buttons functional by wiring them to Square's Orders API. A single Square order in `DRAFT` state serves as the persistent cart per customer. A new `/cart` page displays line items with quantity controls, and Server Actions handle all cart mutations server-side — never exposing Square credentials to the client.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: Next.js 16.x (App Router), React 19.x, Square SDK 45.x, Clerk (auth), Zod (validation), Tailwind CSS 4.x, shadcn/ui

**Storage**: Square Orders API (draft orders) — no additional database; cart state is fully managed through Square

**Testing**: Vitest (unit + integration), RTL + user-event + MSW (integration), Playwright (E2E — future)

**Target Platform**: Vercel (Pro)

**Project Type**: Web application (Next.js App Router)

**Performance Goals**: Add-to-cart confirmation within 2 seconds; cart page renders within 500ms

**Constraints**: All Square calls server-side; cart persists across sessions via Square customer ID; must work without JavaScript (progressive enhancement)

**Scale/Scope**: Single-region e-commerce site; ~500 concurrent customers

## Constitution Check

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | **PASS** | Cart page (`/cart`) is a RSC; "Add to Cart" uses `<form action={serverAction}>`; cart mutations via Server Actions |
| II | API Route Security | **PASS** | All Square calls inside Server Actions (`"use server"`); tokens never reach the browser. Documented deviation: Server Actions used instead of Route Handlers — this follows the constitution's Principle I allowance for "cart mutations" via Server Actions, and the primary rationale (credential security) is fully preserved. |
| III | Type-Safe Data Flow | **PASS** | `Cart`, `CartLineItem` interfaces in `lib/square/types.ts`; Zod validation on Server Action inputs; `@/*` imports only |
| IV | Vercel-Native Performance | **PASS** | `/cart` uses RSC with streaming; `<Suspense>` boundaries around cart data; no client-side Square calls |
| V | Progressive Enhancement | **PASS** | Add-to-cart buttons use native `<form action={...}>` elements; cart page functional without JavaScript; quantity update/remove as `<form>` submissions |
| VI | Gherkin-First Testing | **PASS** | `.feature` file exists with 13 scenarios across 3 user stories |
| VII | Environment-Driven Configuration | **N/A** | No new environment variables; reuses existing `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID` |

## Figma Design Specifications

The cart page design is sourced from the **Zeeks Figma file** (`DxuZEmTmV7Hzqa1iBrcVZO`, "Designs" page). Four responsive variants exist: `cart-standard` (1440px), `cart-lg` (1280px), `cart-md` (768px), and `cart-sm` (375px). Implementation should match the `cart-standard` (1440px) design as the primary reference, with responsive adaptations for smaller breakpoints.

### Page Layout (1440px)

```
┌──────────────────────────────────────────────────┐
│  NavBar (full width, 176px)                      │
├───────────────┬──────────────────────────────────┤
│               │  padding: 80px horizontal        │
│  Cart Items   │  top: 64px, bottom: 100px        │
│  (800px)      │                                  │
│               │  ┌──────────────────────────┐    │
│  "Shopping    │  │  Order Summary           │    │
│   Cart"       │  │  (416px)                 │    │
│  Outfit Black │  │                          │    │
│  32px         │  │  Subtotal      $XXX.XX   │    │
│               │  │  Taxes note              │    │
│  ┌─────────┐  │  │  ─────────────────      │    │
│  │Cart Item│  │  │  Total          $XXX.XX  │    │
│  │132px    │  │  │                          │    │
│  └─────────┘  │  │  [Proceed to Checkout]   │    │
│  ┌─────────┐  │  │  (primary, full width)   │    │
│  │Cart Item│  │  └──────────────────────────┘    │
│  └─────────┘  │                                  │
│  24px gap     │  64px gap between columns         │
├───────────────┴──────────────────────────────────┤
│  Footer (full width, 514px)                      │
└──────────────────────────────────────────────────┘
```

### Cart Item Row (800px × 132px)

- Horizontal layout, items vertically centered
- Padding: 16px all around
- Internal gap: 24px
- Border: 1px solid, color token `VariableID:10:65` (#CDCDD8)
- Border radius: 12px
- Content (to be mapped): product image, name, quantity picker, unit price, line total, remove button

### Order Summary Sidebar (416px)

- Vertical layout, 32px padding all around
- Internal gap: 24px
- Background: `VariableID:10:44` (#F5F5F8)
- Border: 1px solid `VariableID:10:65` (#CDCDD8)
- Border radius: 16px
- **Heading**: "Order Summary" — Outfit Black 900, 22px
- **Rows** (16px gap): Subtotal (label + amount), taxes note ("Taxes and shipping calculated at checkout"), divider, Total (label + amount)
- **CTA**: "PROCEED TO CHECKOUT" — Primary button, full width, Rubik Bold 700, 14px uppercase

### Design Tokens (from Figma Variables)

| Usage | Token | Hex |
|-------|-------|-----|
| Page background | `VariableID:10:43` | #FFFFFF |
| Summary background | `VariableID:10:44` | #F5F5F8 |
| Footer background | `VariableID:10:46` | #0E0E2C |
| Text primary | `VariableID:10:51` | #0E0E2C |
| Text muted | `VariableID:10:53` | #9090A8 |
| Text white | `VariableID:10:54` | #FFFFFF |
| Sale/accent | `VariableID:10:58` | #E89516 |
| Primary CTA | `VariableID:10:62` | #F5A623 |
| Border | `VariableID:10:65` | #CDCDD8 |

### Typography

| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|-------------|
| Page heading "Shopping Cart" | Outfit | Black 900 | 32px | 40.32px |
| "Order Summary" heading | Outfit | Black 900 | 22px | 27.72px |
| Body text | Rubik | Regular 400 | 12px | 16.8px (140%) |
| Category nav links | Rubik | SemiBold 600 | 15px | 17.77px |
| Button label | Rubik | Bold 700 | 14px | 16.59px, uppercase |

### Components to Build (matched against Figma)

| Figma Layer | Implementation | Status |
|-------------|---------------|--------|
| `nav-bar` (INSTANCE) | `@/components/nav-bar.tsx` | Already exists — reuse |
| `footer` (INSTANCE) | `@/components/footer.tsx` | Already exists — reuse |
| `Button` (INSTANCE, "Proceed to Checkout") | `@/components/ui/button.tsx` (shadcn) | Already exists — reuse primary variant |
| `cart-items-column` (cart list + items) | `components/cart/cart-line-item.tsx` | **New** |
| `order-summary-column` (sidebar) | `components/cart/cart-summary.tsx` | **New** |

## Project Structure

### Documentation (this feature)

```text
specs/023-shopping-cart/
├── spec.md
├── plan.md              # This file
├── features/
│   └── shopping-cart.feature
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
app/
├── cart/
│   ├── page.tsx                        # NEW: Server Component, fetches cart data
│   ├── layout.tsx                      # NEW: Cart page layout wrapper
│   ├── actions.ts                      # NEW: Server Actions (addToCart, getCart, updateItem, removeItem)
│   └── __tests__/
│       ├── page.test.tsx               # NEW: Cart page integration test
│       └── actions.test.ts             # NEW: Server Action unit tests

lib/
├── square/
│   ├── types.ts                        # MODIFY: Add Cart, CartLineItem, AddToCartInput types
│   ├── cart.ts                         # NEW: Cart data-fetching logic (findOrCreateDraftOrder, buildCart, etc.)
│   └── __tests__/
│       └── cart.test.ts                # NEW: Unit tests for cart data transforms

components/
├── cart/
│   ├── cart-client.tsx                 # NEW: Client component for cart page (interactive quantity/remove)
│   ├── cart-line-item.tsx              # NEW: Single cart row (product image, name, qty, price, remove)
│   ├── cart-summary.tsx                # NEW: Subtotal display
│   ├── add-to-cart-form.tsx            # NEW: Wraps Add to Cart button in a form with Server Action
│   ├── cart-indicator.tsx              # NEW: NavBar cart item count badge (future)
│   └── __tests__/
│       ├── cart-client.test.tsx        # NEW: Integration test for cart page interactions
│       ├── add-to-cart-form.test.tsx   # NEW: Integration test for add-to-cart flow
│       └── (future additions)

    product-detail/
    ├── product-info.tsx                # MODIFY: Replace static button with <AddToCartForm>
    ├── product-detail-client.tsx        # MODIFY: Pass variationId to AddToCartForm
    └── __tests__/
        └── product-info.test.tsx       # MODIFY: Test add-to-cart form rendering

├── game-card.tsx                       # MODIFY: Replace static button with <AddToCartForm>

middleware.ts                           # MODIFY: Add /cart to protected routes
```

## Data Flow

### Add to Cart

```
User clicks "Add to Cart" on product page
  → <form action={addToCart}> with hidden inputs (catalogObjectId, variationId, quantity)
  → Server Action: addToCart(formData)
    1. auth() → userId; if !userId, return { error: "Sign in required" }
    2. getSquareCustomerId(userId) → squareCustomerId
    3. findExistingDraftOrder(squareCustomerId) via ordersApi.search({ filter: { stateFilter: { states: ["DRAFT"] }, customerFilter } })
    4. IF no draft order:
       a. ordersApi.createOrder({ order: { locationId, customerId, lineItems: [{ catalogObjectId, quantity }], state: "DRAFT" } })
    5. IF draft order exists:
       a. Check if lineItems already contain catalogObjectId+variationId
       b. IF yes: updateOrder with incremented quantity on existing line item
       c. IF no: updateOrder with new line item appended
    6. Return { success: true, lineItemCount: N } or { error: "..." }
  → Client: revalidatePath("/cart"), show confirmation toast
```

### View Cart

```
User navigates to /cart
  → Server Component: auth() → userId → getSquareCustomerId → squareCustomerId
  → getCart(squareCustomerId):
    1. findExistingDraftOrder(squareCustomerId) via ordersApi.search
    2. IF no draft order → return { lineItems: [], subtotal: 0 }
    3. ordersApi.retrieveOrder(orderId) for full line item details
    4. Enrich line items with product names/prices from catalog (or from order data)
    5. Check availability of each product
    6. Return { lineItems: CartLineItem[], subtotal: { amount, currency } }
  → Pass cart data as props to CartClient
```

### Update Quantity / Remove

```
User changes quantity or clicks "Remove" on cart page
  → <form action={updateCartItem}> or <form action={removeCartItem}>
  → Server Action:
    1. Auth guard (same pattern)
    2. ordersApi.updateOrder(orderId, { order: { lineItems: updatedLineItems } })
    3. Return new cart state
  → Client: revalidatePath("/cart")
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Server Actions instead of Route Handlers for cart mutations (Principle II deviation) | Principle I explicitly permits Server Actions for cart mutations; the credential-security rationale of Principle II is fully preserved | Route Handlers would add unnecessary indirection without additional security benefit for cart operations |

## Key Square API Operations

| Operation | Square API Call | When |
|-----------|----------------|------|
| Find draft order | `ordersApi.search({ locationIds, query: { filter: { stateFilter: { states: ["DRAFT"] }, customerFilter } } })` | Every cart access |
| Create first order | `ordersApi.createOrder({ order: { locationId, customerId, lineItems, state: "DRAFT" } })` | First "Add to Cart" |
| Update order (add/increment) | `ordersApi.updateOrder(orderId, { order: { lineItems: [...] }, fieldsToClear: [], idempotencyKey })` | Subsequent "Add to Cart" |
| Update quantity | `ordersApi.updateOrder(orderId, { order: { lineItems: [...] }, fieldsToClear: [] })` | Quantity change / remove |
| Retrieve full order | `ordersApi.retrieveOrder(orderId)` | Cart page load for detailed line item data |

## Edge Cases Handled

- **First cart creation**: No existing draft order → `createOrder` with `state: "DRAFT"`
- **Adding same product again**: Match by `catalogObjectId` + `variationId`; increment quantity instead of duplicating
- **Multiple variations of same product**: Treated as separate line items (different `variationId`)
- **Product availability changed**: Checked on cart page load; unavailable items flagged but not removed
- **API failure during mutation**: Caught in Server Action try/catch; previous state preserved; error returned to client
- **Empty cart**: Zero draft orders found → show empty state; no error
