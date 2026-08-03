# Tasks: Paginated Order History

**Input**: Design documents from `/specs/022-order-transactions-view/`
**Scope**: Transaction history and tabbed UI removed. Cursor-based order pagination only.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Types & Data Layer

- [x] T001 [US1] Add `PaginatedOrdersResult` type to `lib/square/types.ts`
- [x] T002 [US1] Modify `fetchOrderHistory` in `lib/square/dashboard.ts` to accept cursor and return `{ orders, nextCursor }`

## Phase 2: US1 — Paginated Orders

- [x] T003 [US1] Create `loadMoreOrders` Server Action at `app/account/actions.ts`
- [x] T004 [US1] Refactor `OrdersCard` in `components/account/orders-card.tsx` to client component with pagination state, "Load More" button, and loading state
- [x] T005 [US1] Wire updated props (`nextCursor`) from `fetchDashboardData` into `OrdersCard` in account page
- [x] T006 [US1] Add "Showing all N orders" indicator when cursor is exhausted
- [x] T007 [US1] Update `lib/square/__tests__/dashboard.test.ts` for new cursor-based shape
- [x] T008 [US1] Update `app/account/__tests__/page.test.tsx` for new `DashboardResult` shape

## Phase 3: Verification

- [x] T009 Quality gates: `tsc --noEmit`, `npm run lint`, `npm test`

---

### Removed Tasks

| Task | Description | Reason |
|------|-------------|--------|
| ~~T009-T012~~ | TransactionsCard + tests | Removed — tenders not available in search, payments API lacks customer filter |
| ~~T013-T016~~ | HistoryTabs + tests | Removed — only one section (Orders), no tabs needed |
| ~~T017-T018~~ | Integration tests for transactions/tabs | Removed with above |
