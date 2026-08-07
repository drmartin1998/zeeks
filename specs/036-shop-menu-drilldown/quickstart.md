# Quickstart: Validating the Shop Menu Drilldown

**Feature**: 036-shop-menu-drilldown | **Date**: 2026-08-07

This guide documents runnable validation scenarios that prove the Shop menu works end-to-end. It references the [data model](./data-model.md) and [API contract](./contracts/catalog-categories.md) rather than duplicating them.

## Prerequisites

- Local dev server running via `vercel dev` (see `.clinerules/dev-server.md` — check `lsof -ti:3000` first; reuse a running server).
- `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_CHANNEL_ID` configured (via `vercel env pull` or Vercel project env).
- Square catalog contains at least one top-level category with subcategories (e.g., Miniatures with a brand like "Games Workshop" and nested ranges).

## Setup

```bash
# Install deps (if not present)
npm install

# Start server (only if port 3000 is free)
vercel dev            # or reuse existing server on :3000

# Run static quality gates
tsc --noEmit
npm run lint
```

## Validation scenarios

### Scenario 1 — API returns the nested tree

```bash
curl -s -H "Cache-Control" http://localhost:3000/api/catalog/categories?nested=true | head -c 1000
```

**Expected**: A JSON object with a `tree` array of top-level categories, each with `label`, `href`, and `children` (recursive). A leaf node has `children: []`. Contrast with `?nested` omitted, which returns the legacy flat array.

### Scenario 2 — Desktop megamenu opens

1. Open the site at a desktop viewport width (≥ 1024px).
2. Hover over the "Shop" nav item.
3. **Expected**: A full-width megamenu panel opens beneath the nav showing top-level categories as columns, each with a heading, subcategory links, and a "Shop All" link. Level-2 children are indented under their parent subcategory.
4. Move the pointer away from the "Shop" item and the panel.
5. **Expected**: The panel closes.

### Scenario 3 — Desktop megamenu navigation

1. Open the megamenu (hover "Shop").
2. Click a subcategory link.
3. **Expected**: You are taken to `/categories/<parent>?sub=<sub>` and the megamenu closes.

### Scenario 4 — Mobile drilldown

1. Set viewport to a mobile/narrow width (< 1024px).
2. Tap "Shop".
3. **Expected**: A full-screen drawer opens listing top-level categories.
4. Tap a category with subcategories (e.g., Miniatures).
5. **Expected**: Drawer advances to level-2 showing that category's subcategories, with the selected parent visible in the header and a back control.
6. Tap a subcategory with further children (e.g., Games Workshop).
7. **Expected**: Drawer advances to level-3 showing leaf subcategories.
8. Tap the back control.
9. **Expected**: Returns to the previous level.
10. Tap a leaf category.
11. **Expected**: Navigates to that category's page and the drawer closes.

### Scenario 5 — Default closed state

1. Load any page on a desktop viewport.
2. **Expected**: The Shop menu is closed (no megamenu) on page load; it only opens on hover/click.

### Scenario 6 — No fabricated data on failure

1. Temporarily point `SQUARE_CHANNEL_ID` to an invalid channel (or stop the Square dependency).
2. Reload the site.
3. **Expected**: The Shop menu is not shown (or shows a graceful empty state); no fabricated/hardcoded categories appear.

## Automated tests

```bash
npm test              # Vitest — unit (tree transforms) + integration (megamenu open/close, mobile drilldown)
npm run test:e2e      # Playwright — Shop → category journey on desktop and mobile
```

See `data-model.md` for the tree invariants and `contracts/catalog-categories.md` for the API shape.