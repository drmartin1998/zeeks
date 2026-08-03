# Implementation Plan: Paginated Order History

**Branch**: `022-order-transactions-view` | **Date**: 2026-08-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/022-order-transactions-view/spec.md`
**Scope Note**: Transaction history and tabbed UI were removed. This plan covers cursor-based order pagination only.

## Summary

Expand the account dashboard's order history from a capped 10-row list into a paginated view with "Load More" support via Square's cursor-based search. The existing `fetchDashboardData` function is extended to accept a cursor parameter. A Server Action handles loading additional pages client-side.

## Constitution Check

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | **PASS** | Initial data fetch in RSC; "Load More" via Server Action |
| II | API Route Security | **N/A** | Square calls remain server-side via Server Action |
| III | Type-Safe Data Flow | **PASS** | `PaginatedOrdersResult` added to `lib/square/types.ts` |
| IV | Component Architecture | **PASS** | OrdersCard refactored to client component for pagination state |
| V | Performance & Caching | **PASS** | Cursor-based pagination avoids loading all orders at once |
| VI | Gherkin-First Testing | **PASS** | .feature file with 5 scenarios |
| VII | No Mock Data Fallback | **PASS** | Live Square data only |

## Project Structure

```
specs/022-order-transactions-view/
├── spec.md
├── plan.md
├── features/
│   └── order-transactions-view.feature
└── checklists/
    └── requirements.md

app/
├── account/
│   ├── page.tsx                        # MODIFY: Pass cursor to OrdersCard
│   ├── actions.ts                      # NEW: loadMoreOrders Server Action
│   └── __tests__/
│       └── page.test.tsx               # MODIFY: Updated mock shape

lib/
├── square/
│   ├── types.ts                        # MODIFY: Added PaginatedOrdersResult
│   ├── dashboard.ts                    # MODIFY: Cursor-based fetchOrderHistory
│   └── __tests__/
│       └── dashboard.test.ts           # MODIFY: Updated assertions

components/
└── account/
    ├── orders-card.tsx                 # MODIFY: Client component with Load More
    └── __tests__/
        └── (future)
```

## Complexity Tracking

No violations.

## Data Flow

### Page Load
```
User navigates to /account
  → Server Component: auth() → userId → getSquareCustomerId(userId) → squareCustomerId
  → Promise.allSettled([
      fetchCustomerProfile(squareCustomerId),
      fetchLoyaltyBalance(squareCustomerId),
      fetchOrderHistory(squareCustomerId, cursor=null, limit=10) → { orders, nextCursor }
    ])
  → Pass orders + nextCursor as props to OrdersCard
```

### Load More
```
User clicks "Load More"
  → OrdersCard calls loadMoreOrders(cursor) Server Action
  → Server Action: auth() → getSquareCustomerId → ordersApi.search({ cursor, limit: 10 })
  → New orders appended to existing list, cursor updated
```
