# Research: Faceted Product Listing Filters

**Feature**: 030-product-faceted-filters
**Date**: 2026-08-06

## 1. Brand (Custom Attribute) Extraction

**Decision**: Read the brand from `itemData.customAttributeValues[<brandKey>].stringValue` in `getSquareProductsByCategorySlug()` (and the matching `app/api/catalog/products/route.ts` mapper), where `<brandKey>` is the Square custom attribute definition key configured for brand (e.g., `"brand"`). Products without a brand value produce `brand: undefined` and simply do not appear under any brand option.

**Rationale**: The Square SDK exposes `CatalogObjectBase.customAttributeValues` as `Record<string, CatalogCustomAttributeValue>`. Because filtering is client-side (FR-009), we only need to read the brand value onto each product; we do not need to pass `customAttributeFilters` to `searchItems` for server-side faceting.

**Implementation**:
- In `lib/square/catalog.ts`, extend the item mapping in `getSquareProductsByCategorySlug()` to read `(itemData.customAttributeValues?.[BRAND_KEY])?.stringValue`.
- Add `BRAND_KEY = "brand"` configured constant (name as a config value, not hardcoded data).
- Add `brand?: string` to `SquareProduct` (catalog.ts) and `DisplayProduct` (types.ts).
- Mirror the read in `app/api/catalog/products/route.ts` mapper if that route supplies listing data.

**Key detail**: `CatalogCustomAttributeValue` provides the value via `stringValue` (STRING type) and each value carries a `key`. The map is keyed by the custom attribute definition key.

**Alternatives considered**:
- **Server-side `customAttributeFilters` on `searchItems`**: Rejected — unnecessary since filtering is client-side; would add complexity and per-filter server round-trips.
- **Separate brand custom-attribute API call**: Rejected — `searchItems`/`batchGet` already return `customAttributeValues` on items; no extra call needed.

## 2. Availability Extraction

**Decision**: Derive per-product availability from `variations[].itemVariationData.locationOverrides[]`, classifying a product as **in stock if any variation is available** (FR-005). Available = the variation is not sold out at the configured location.

**Rationale**: This matches the existing availability logic in `getProductDetailBySlug()` (which reads `locationOverrides` and `soldOut`), and the clarified semantics (any-variation in stock). Reusing the same logic keeps behavior consistent across detail and listing pages.

**Implementation**:
- In `getSquareProductsByCategorySlug()`, for each item, inspect each variation's `itemVariationData.locationOverrides[?]` for the configured `locationId`.
- A variation is available if its location override is not `soldOut`.
- Product availability = `"IN_STOCK"` if any variation is available, else `"OUT_OF_STOCK"` (products with no location override data default to `"IN_STOCK"`).
- Add `availability: "IN_STOCK" | "OUT_OF_STOCK"` to `SquareProduct` and `DisplayProduct`.

**Note**: Availability is computed server-side from the catalog data already returned by `searchItems` (location overrides are included). No separate inventory API call is required for the listing facets.

**Alternatives considered**:
- **RetrieveInventory API per variation**: Rejected — overkill for a client-side facet; would add N network calls and latency.
- **Only first variation**: Rejected — contradicts clarified any-variation semantics (FR-005).

## 3. Client-Side Faceted Navigation

**Decision**: All three facets (subcategory, brand, availability) dynamically narrow their available options to only values present among the products matching the other active filters (FR-003, FR-006). Filtering is fully client-side over the loaded product set.

**Rationale**: Matches clarified behavior (Q3, Q4) and the standard faceted-search UX. With ~50 products, deriving narrowed options in-memory is trivial and instant.

**Implementation**:
- State managed in `ProductListingPage` (client component): `activeSubcategories`, `activeBrands`, `activeAvailability`.
- Applied filter result = products matching ALL active facet groups (AND across groups), and OR within a group (multi-select brand, per FR-004).
- Each facet group's visible options = distinct values present among the products that match the *other* active facet groups.
- Filter state synced to URL query params (`sub`, `brand`, `availability`) for shareability/preservation (FR-012 edge case).

**Alternatives considered**:
- **Server-side refetch per filter**: Rejected — clarified as client-side (Q1); slower and more complex.
- **Static (non-narrowing) facets**: Rejected — clarified that all facets narrow (Q3, Q4).

## 4. Responsive Facet Layout

**Decision**: Implement the three responsive layouts from the Figma designs within the product listing components:
- **Large (lg)**: persistent left sidebar (280px) with three facet groups (Categories, Brand, Availability) beside the product grid.
- **Medium (md)**: horizontal filter strip above the grid — Categories as the hierarchical facet (drill-down), Brand and Availability as two equal columns.
- **Small (sm)**: a "Filter & Categories" toggle button with an "Active: N" count badge; category filters shown as chips; brand/availability behind the toggle.

**Rationale**: Matches the Figma `product-listing-faceted` lg/md/sm frames and FR-008. Uses Tailwind responsive utilities (`lg:`, `md:`) and the existing breakpoints.

**Drill-down consistency (FR-008a, bug fix)**: The subcategory facet must reveal a selected parent's children at every breakpoint, not just on the large sidebar. The md horizontal strip and the sm filter toggle therefore reuse the same hierarchical `categoriesFacet` (the `SubcategoryFacet` when the tree is available) instead of flat `CategoryChips` built from direct children only. The flat chip widgets were removed from the md strip and the inline md chips block; at md the hierarchical facet renders once in the strip, and at sm the toggle reveals the sidebar (which already uses the hierarchical facet). This keeps a single source of truth for the category facet and guarantees identical drill-down behavior across lg/md/sm.

**Alternatives considered**:
- **Single sidebar all sizes**: Rejected — does not match the Faceted design for md/sm.
- **Drawer/sheet for sm**: The design shows a toggle with an active count; the toggle opens the expanded filters. Implemented as a toggle that reveals the facet groups.

## 4a. Price Range Facet Removed

**Decision**: The **Price Range** facet has been **removed entirely** from the feature. It is no longer rendered on any layout, and all associated state, URL params (`min`/`max`), the `PriceRangeFacet` component, and the `.price-range-thumb` styles were deleted.

**Rationale**: The product owner explicitly requested the facet's removal — it "should not exist." The large-screen sidebar now contains only the **Categories → Brand → Availability** facet groups, separated by 1px divider lines, per the authoritative Figma `faceted-directory-body` design.

**Implementation**:
- Deleted `components/product-listing/price-range-facet.tsx` and removed its export from `components/product-listing/index.ts`.
- Removed `priceRange`, `priceBounds`, `effectivePriceRange`, `handlePriceRangeChange`, and the price filter branch from `ProductListingPage`; the `min`/`max` URL params and `?min=`/`?max=` initialization are gone.
- Removed `priceRange`/`priceBounds`/`onPriceRangeChange` from `FilterBar` props and the facet column.
- Removed the `.price-range-thumb` CSS rules from `app/globals.css`.
- Removed the price-range describe blocks from `filter-facets.test.tsx` and the price-range props from `filter-bar.test.tsx`.

## 4b. Responsive Facet Layout (Design Match)

**Decision**: The product grid uses **1 column on mobile, 2 on md, 3 on lg/xl** (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`), and the facet layout is gated at **lg** for the sidebar (`hidden lg:block`, 280px) and **md** for the strip (`hidden md:block lg:hidden`). On large screens the **sidebar sits to the LEFT of the product results** in a single horizontal `faceted-directory-body`-style flex row (280px sidebar + the product grid column with a 40px gap). The lg sidebar uses **1px divider lines** between every facet group and header styling per the Figma: **Categories** header is ExtraBold 800 @ 18px; **Brand / Availability** headers are Bold 700 @ 16px; all are UPPERCASE in dark navy `#0E0E2C` (`text-text-primary`).

**Implementation**:
- `product-grid.tsx`: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (was `sm:grid-cols-2 ... xl:grid-cols-4`); gained an optional `fill` prop to render without its own outer `max-w`/`px` container when nested inside the FilterBar layout column.
- `filter-bar.tsx`: lg layout is a `flex fle-col gap-10 lg:flex-row` container — `<aside className="hidden w-[280px] shrink-0 self-start lg:block">` (Categories → Brand → Availability) on the LEFT and `<div className="min-w-0 flex-1">` holding the product grid + pagination on the RIGHT. The sm drawer and lg sidebar share the same `facetGroups` (divided by `divide-border-default`). `FilterBar` now accepts `children` (the products column) so the grid renders beside the sidebar, not below it. Colors use the Figma tokens: sidebar `bg-surface-secondary`, page `bg-surface-primary`, dividers `border-border-default`, headers `text-text-primary`, checkboxes `accent-zeeks-purple`.
- `FacetGroup` gained a `headerClassName` prop; `SubcategoryFacet`/`CategoryChips` headers upgraded to `text-[18px] font-extrabold`.

**Alternatives considered**:
- **Keep sm-2-col / xl-4-col grid**: Rejected — does not match the design (2 cols at md, 3 at lg).
- **Sidebar at xl only**: Rejected — the design specifies the sidebar at lg; aligning the sidebar and grid breakpoints avoids a 3-col grid with no sidebar window.
- **Sidebar above the grid (stacked)**: Rejected — the Figma `faceted-directory-body` is a HORIZONTAL container; the previous implementation rendered the sidebar and the grid as separate blocks, placing the facets above the results. The sidebar is now rendered to the LEFT of the products on lg via a single flex row.

## 5. No Mock Data in Production

**Decision**: Brand and availability values come from live Square catalog data only. No hardcoded product/brand/availability fallback arrays. Empty states (no subcategories, no brands) hide the respective facet group rather than substituting mock data.

**Rationale**: Constitution Rule 2 / Principle VII — no mock data fallback on the live site.

## 6. Recursive Category Hierarchy (Nested Subcategory Bug Fix)

**Decision**: The product fetch must resolve the selected top-level category's subtree **recursively** so products in sub-subcategories (2+ levels deep) are fetched and annotated with their nearest top-level-child ancestor (the visible facet subcategory).

**Rationale**: A subcategory like "Games Workshop" (a direct child of Miniatures) may have **no products directly assigned to it** — its products live in its own sub-subcategories (e.g., "Space Marines", "Age of Sigmar"). The previous implementation only searched `[parentId, ...directChildren]`, so products in sub-subcategories were never fetched and therefore got no `subCategorySlug`. As a result "Games Workshop" never appeared as a facet option when options were derived from product `subCategorySlug`s.

**Implementation**:
- Added `buildSubcategoryTree(allCats, parentId)` in `lib/square/catalog.ts`. It builds a parent→children adjacency and does a depth-first walk from each direct child of the parent, returning:
  - `descendantIds` — every descendant category ID at any depth;
  - `subByDescendantId` — maps every descendant ID to its **nearest top-level-child ancestor** `SquareSubCategory`.
- `getSquareProductsByCategorySlug()` now searches `[parentId, ...descendantIds]` (all depths) and annotates each product by looking up its category IDs in `subByDescendantId`. A product in a sub-subcategory under "Games Workshop" therefore gets `subCategorySlug = "games-workshop"`.
- The same recursive resolution is applied in `app/api/catalog/products/route.ts` (the Route Handler) by reusing the exported `buildSubcategoryTree` helper, keeping both data paths consistent.
- `getSquareSubcategories()` still returns only direct children (the facet list), which already included "Games Workshop". The display side (`ProductListingPage.visibleSubs`) returns all subcategories by default when no brand/availability filter is active, so "Games Workshop" now displays.

**Alternatives considered**:
- **Keep direct-children-only search**: Rejected — leaves nested products unfetched and "Games Workshop" hidden.
- **Flatten all descendants as independent facet options**: Rejected — would surface "Space Marines"/"Age of Sigmar" as top-level subcategory options; the product should roll up to its nearest top-level child ("Games Workshop") to match the intended facet hierarchy.

## 7. Drill-Down Subcategory Facet (Parent → Child Reveal)

**Decision**: Selecting a subcategory reveals its child subcategories in the facet as a second (indented) level, and the product list filters to all products under the selected node (node + descendants). Selecting a revealed child filters to that child's products only.

**Rationale**: A subcategory like "Games Workshop" (a direct child of Miniatures) has its own children ("Warhammer 40K", "Age of Sigmar"). The product owner wants a drill-down so a shopper can filter to a grandchild subcategory. The hierarchy is a real tree in Square (`parentCategory.id`), and the data layer already rolls nested products up to their nearest top-level child for the flat facet; the drill-down needs the full tree plus a per-product path.

**Semantics (documented)**:
- Selecting a **parent** expands it to reveal its children AND filters to all products under that parent (parent + descendants).
- Selecting a **child** filters to that child's products (child + descendants).

**Implementation**:
- Added `CategoryTreeNode` (`{ id, name, slug, children }`) and pure `buildCategoryTree(allCats, parentId)` in `lib/square/catalog.ts`, which builds the nested tree of each direct child and its descendants.
- Added `flattenCategoryTree(rootNodes)` returning `slugPathByCategoryId` (category ID → ordered slug path from top-level child down to that category).
- Added `getCategoryTree(slug)` async that fetches catalog categories and returns the tree for the page. `app/shop/[category]/page.tsx` passes it to `ProductListingPage`.
- **Product annotation for grandchild filtering**: each product is now annotated with `subCategorySlugs` — the ordered slug path (top child → deepest). A product is "under" facet node X iff X's slug appears in its path. This is added in both `getSquareProductsByCategorySlug` (catalog.ts) and the products Route Handler (`app/api/catalog/products/route.ts`); `ProductSchema` accepts the optional field.
- Added `SubcategoryFacet` component (`components/product-listing/subcategory-facet.tsx`) that renders the tree as checkboxes; children of a selected node are revealed (indented). Used by `FilterBar` for the Categories facet when the tree is provided; falls back to the flat `FacetGroup` when only flat `subCategories` are available (backward compatible).
- `ProductListingPage` computes subcategory facet counts across each product's path (`subCategorySlugs`), so a parent's count includes all descendants and a grandchild's count reflects its own products. Filtering uses path membership (`productMatchesSub`), falling back to `subCategorySlug` equality for products without the path.

**Alternatives considered**:
- **Keep only the flat, direct-children facet**: Rejected — grandchildren are unreachable; the product owner explicitly wants a second level.
- **Make a selected parent a pure container that requires picking a child**: Rejected — this would hide all parent products and force unnecessary clicks; the "parent filters to parent + descendants" rule is more useful and consistent.
- **Flatten all descendants as sibling options**: Rejected (consistent with §6) — loses the hierarchy and overloads the facet.

## 8. Expansion State Separate From Filter Selection (Child Collapse Bug Fix)

**Decision**: Split the subcategory facet into two distinct pieces of state: the **filter selection** (`activeSubs`, single-select leaf) and the **expansion/reveal state** (`expandedSubs`, the set of node slugs whose children are shown). `SubcategoryFacet` reveals a node's children based on `expandedSlugs` (falling back to `selectedSlugs` when not provided), and keeps the checkbox `checked` state based on `selectedSlugs`.

**Rationale**: Previously a node's children were revealed only when the node was `selected`. Because selection is single-select, selecting a child REPLACED the selected slug — removing the parent — so the parent's children collapsed and disappeared. The user wants to keep drilling deeper without the hierarchy collapsing. Separating expansion from selection fixes this: selecting a child keeps its ancestors expanded.

**Implementation**:
- `ProductListingPage` derives `expandedSubs` from `activeSubs` via `collectExpandedSlugs(subTree, activeSubs)`: it walks the tree and, for every selected node, adds the full ancestor path (top-level child → selected node) plus the selected node itself to the expanded set. Derived from the tree so it is always consistent with the selection.
- `expandedSubs` is threaded `ProductListingPage → FilterBar (expandedSubs prop) → SubcategoryFacet (expandedSlugs prop)`.
- `SubcategoryFacet` / `SubcategoryNode` accept an optional `expandedSlugs?: string[]`. When provided, children are revealed when `expandedSlugs.includes(node.slug)`; otherwise it falls back to the legacy `selected`-driven reveal for backward compatibility. The checkbox remains `checked` based on `selectedSlugs`.

**Alternatives considered**:
- **Track expansion in `toggleSub` by toggling the ancestor path directly**: Rejected — deriving from the tree guarantees the expanded set never drifts from the selection and avoids extra state to keep in sync.
- **Multi-select expansion where selecting a child also keeps the parent selected**: Rejected — would change the filter semantics (selecting a child would no longer filter to only that child's products). The parent must remain un-checked while staying expanded.

## Assumptions
- A single brand custom attribute definition key (e.g., `"brand"`) is used across the catalog. If multiple keys exist, they will be unified in the data layer.
- The location override data needed for availability is present in the `searchItems` response for the configured `locationId`.
- The existing category listing page (`app/shop/[category]`) is the target for the faceted design; the search-results page is out of scope (per spec).