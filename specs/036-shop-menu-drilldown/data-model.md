# Data Model: Shop Menu Drilldown

**Feature**: 036-shop-menu-drilldown | **Date**: 2026-08-07

## Entities

### NavCategoryNode (hierarchical nav category)

Represents a node in the Shop menu's category tree. Replaces the flat `NavCategory` for the Shop menu while `NavCategory` remains for informational/static links.

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Display name of the category (e.g. "Miniatures"). |
| `href` | `string` | Destination URL. Top-level: `/categories/<slug>`; subcategory: `/categories/<parent-slug>?sub=<slug>`. |
| `children` | `NavCategoryNode[]` | Nested subcategories. Empty (`[]`) for a leaf category (no expand affordance). Supports up to two levels below the top-level node. |
| `hasChildren` | `boolean` | Derived: `children.length > 0`. Drives whether the node shows an expand/drilldown affordance. |

**Validation / invariants**:
- A node's `children` may be empty (leaf) — a leaf is a direct navigable link (FR-012).
- `children` depth is capped at two levels below the top-level category (FR-003).
- `href` for a subcategory MUST use the `?sub=<slug>` query-parameter scheme (clarification Q4).
- No node may be hardcoded; all nodes derive from Square catalog categories (FR-011).

### CategoryTree

The full nested structure passed to `NavBar` for rendering the Shop menu (desktop megamenu + mobile drawer).

| Field | Type | Description |
|-------|------|-------------|
| `root` | `NavCategoryNode[]` | Top-level categories, each with nested `children`. |
| `source` | `"square" \| "empty"` | Indicates whether the tree came from live Square data or is empty (data unavailable). |

**Validation**:
- `source === "empty"` ⟹ `root` is `[]` and the Shop menu is not rendered. No fabricated data (Constitution VII).

## Data flow

1. `NavBarServer` (RSC) calls `getNavCategoryTree()` (server data layer).
2. `getNavCategoryTree()` fetches `/api/catalog/categories` (Route Handler) and shapes the flat response into a `NavCategoryNode[]` tree, or returns `source: "empty"` on failure.
3. `/api/catalog/categories` Route Handler calls `fetchAllCategories()` + `buildCategoryTree()` (already in `lib/square/catalog.ts`) to assemble nesting, validating the response with a Zod schema (Constitution III).
4. `NavBar` (client) receives the `CategoryTree` prop and renders `ShopMegamenu` (desktop) or `ShopMobileDrawer` (mobile) based on viewport.

## State transitions

### Desktop megamenu visible state

| From | Trigger | To |
|------|---------|-----|
| Closed (default) | Hover over "Shop" / click / tap | Open |
| Open | Pointer leaves menu item + panel | Closed |
| Open | Click a link (subcategory / Shop All) | Closed (and navigate) |
| Open | Click outside / Escape | Closed |

### Mobile drilldown depth

| Depth | Content | Back target |
|-------|---------|-------------|
| 1 | Top-level categories | — (drawer root) |
| 2 | Subcategories of selected top-level | Level 1 |
| 3 | Leaf subcategories of selected subcategory | Level 2 |

The selected parent category is retained in the panel header at each depth (FR-010).

## Relationships

- A `NavCategoryNode` has zero-to-many `children` (`NavCategoryNode`).
- The `CategoryTree` contains many top-level `NavCategoryNode`s.
- Subcategory destination pages (`/categories/[slug]?sub=<sub>`) are the existing category-listing routes (feature 008), not new routes.