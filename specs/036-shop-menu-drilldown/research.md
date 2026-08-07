# Research: Shop Menu Drilldown

**Feature**: 036-shop-menu-drilldown | **Date**: 2026-08-07

Research resolves the unknowns and technology choices for the Shop menu. All findings are grounded in the existing codebase patterns (Square catalog handling, Route Handler architecture, nav component structure) and the Figma megamenu designs.

## 1. How to obtain the nested category tree

**Decision**: Extend the existing `/api/catalog/categories` GET route to return a hierarchical tree (top-level categories each with nested `children` up to two levels), consumed by `NavBarServer` via `fetch`. Reuse the existing pure `buildCategoryTree(allCats, parentId)` in `lib/square/catalog.ts` to assemble nesting from the flat `fetchAllCategories()` result.

**Rationale**: The codebase already fetches all categories (top-level + subcategories) in one `fetchAllCategories()` call and already has `buildCategoryTree()` — a pure, unit-testable transform that builds a `CategoryTreeNode[]` from a parent ID. Routing the tree through the existing Route Handler satisfies Constitution II (token stays server-side) while centralizing channel/allowlist filtering. The current route already returns `Cache-Control: public, s-maxage=3600`, so the nested tree inheriteds the same caching (Constitution V). The existing `NavCategory` type is flat; a new hierarchical node type is required (see Data Model).

**Alternatives considered**:
- *Fetch the tree directly in a Server Component via the deprecated `getSquareCategories`/`getCategoryTree` SDK calls* — rejected: bypasses Route Handlers, violating Constitution II.
- *Add a separate `/api/catalog/categories/tree` endpoint* — acceptable but unnecessary; extending the existing route keeps one contract with a `?nested=true` switch or a new default response shape.
- *Client-side fetch of the tree in `NavBar`* — rejected: violates server-components-first (Constitution I) and adds a waterfall; the tree is static catalog data better fetched server-side.

## 2. Desktop trigger and dismiss behavior

**Decision**: Megamenu opens on hover over "Shop" and closes when the pointer leaves both the menu item and the panel; click/tap also toggles open/closed (for touch and keyboard). Closed by default on page load (per clarification Q3/Q5).

**Rationale**: Hover-to-open is the conventional e-commerce megamenu pattern and matches the Figma design intent. Click/tap support is required for accessibility (keyboard) and touch devices. Closing on pointer-leave is the least surprising behavior and maps to the acceptance scenario "move the pointer away → menu closes." Default-closed avoids a jarring open state on page load.

**Alternatives considered**:
- *Click-only* — rejected per clarification Q3 (Option A chosen).
- *Always-open on hover, no click* — rejected (no touch/keyboard support).

## 3. Mobile drilldown structure

**Decision**: Implement a three-level drilldown in a full-screen drawer: level-1 (top-level categories), level-2 (subcategories), level-3 (leaf subcategories). Each sub-panel has a back control; the selected parent category stays visible in the panel header (FR-010).

**Rationale**: The Figma `shop-menu-mobile-drilldown` frames define exactly three levels (`frame-level-1`, `frame-level-2`, `frame-level-3`) with category rows (56px) at levels 1–2 and leaf rows (52px) at level 3. The visible header keeps the visitor oriented. This matches the mobile acceptance scenarios and the Miniatures deep-nesting case.

**Alternatives considered**:
- *Expand/collapse accordion in place* — rejected: conflicts with the Figma's separate-frame drilldown design and the back-navigation requirement.

## 4. Subcategory destination URLs

**Decision**: Use the existing query-parameter scheme `/categories/[slug]?sub=<subcategory-slug>` for subcategory links (per clarification Q4). Leaf and top-level categories link to `/categories/[slug]`.

**Rationale**: The codebase already routes subcategory filtering through `?sub=` on category pages (feature 008 subcategory-filtering). Reusing it keeps routing/data-contract consistent and avoids new nested route patterns.

**Alternatives considered**:
- *Nested path `/categories/[parent]/[child]`* — rejected per clarification Q4.

## 5. Nav structure change

**Decision**: Replace the flat top-level category links in the main nav row with a single "Shop" item (per clarification Q1). The catalog hierarchy is reachable only through the Shop menu; informational links (About, etc.) remain as static items.

**Rationale**: Matches the Figma nav row (Shop + informational items) and the confirmed scope. Avoids duplicate entry points and keeps the nav uncluttered.

**Alternatives considered**:
- *Keep flat links alongside Shop* — rejected per clarification Q1 (Option A).

## 6. Empty / error states

**Decision**: When catalog data is unavailable (API failure or empty tree), the Shop menu is not rendered / shows a graceful state; no fabricated categories are shown (FR-011, Constitution VII).

**Rationale**: The existing `NavBar` already handles `categories={[]}` gracefully. The error path returns an empty tree from the data-fetch layer, which simply omits the Shop menu. This preserves the zero-mock-data rule.

**Alternatives considered**:
- *Fall back to hardcoded categories* — rejected: violates Constitution VII.

## Consolidated decisions

- **D1**: Tree fetched server-side via extended `/api/catalog/categories`, reusing `buildCategoryTree()`.
- **D2**: Desktop megamenu: hover-open, leave-close, click/toggle; closed by default.
- **D3**: Mobile: three-level drilldown drawer with back control and visible selected parent.
- **D4**: Subcategory links use `/categories/[slug]?sub=<sub>`.
- **D5**: Flat catalog links replaced by a single "Shop" item.
- **D6**: Empty/error → no Shop menu, no fabricated data.