# Requirements Checklist: Paginated Order History

## Functional Requirements Coverage

| FR | Requirement | Gherkin Coverage | Status |
|----|-------------|------------------|--------|
| FR-001 | Orders fetch with cursor-based pagination (10/page) | @US1 "View initial 10" / "Load next page" | [x] |
| FR-002 | "Load More" button fetches next page via Square cursor | @US1 "Load the next page of orders" | [x] |
| FR-003 | Loading state on "Load More" button | @US1 @edge "Load More disabled during loading" | [x] |
| FR-004 | "Showing all N orders" when exhausted | @US1 "Load all orders until no more remain" | [x] |
| FR-005 | Orders empty state message | @US1 "Customer with no orders sees empty state" | [x] |

### Removed During Implementation

| FR | Requirement | Reason |
|----|-------------|--------|
| ~~FR-005~~ | Transactions via Square Payments API | Square's `OrdersApi.search` doesn't populate `tenders`; Payments API lacks customer filter |
| ~~FR-006~~ | Transaction row: amount, date, method, status | Removed with transactions |
| ~~FR-007~~ | Transactions sorted newest-first | Removed with transactions |
| ~~FR-008~~ | Tabbed interface: Orders + Transactions | Tabs removed — only OrdersCard displayed directly |
| ~~FR-009~~ | Orders tab selected by default | Removed with tabs |
| ~~FR-010~~ | Tab state preserved client-side | Removed with tabs |
| ~~FR-011~~ | Independent degradation | Removed with transactions |
| ~~FR-012~~ | Transactions empty state | Removed with transactions |
| ~~FR-013~~ | (was transactions empty state) | Removed |

## Edge Case Coverage

- [x] Customer with 0 orders → empty state, no "Load More"
- [x] 10 results exactly → "Load More" shown, next fetch determines if removed
- [x] Rapid "Load More" clicks → button disabled during loading
