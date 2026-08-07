# Implementation Plan: Shop Menu Drilldown

**Branch**: `036-shop-menu-drilldown` | **Date**: 2026-08-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/036-shop-menu-drilldown/spec.md`

## Summary

Add a "Shop" menu to the global navigation that consolidates the previously flat top-level category links into a single entry point revealing the catalog hierarchy. On desktop, activating "Shop" opens a full-width megamenu with top-level categories as columns, each column listing its subcategories with level-2 children indented under their parent and a "Shop All" link. On mobile, "Shop" opens a full-screen drawer with a three-level drilldown (top-level → subcategory → leaf), with a back control and the selected parent always visible. The menu is closed by default, opens/closes on hover or click (desktop), navigates leaf categories directly, and pulls its category tree from Square via Route Handlers (extending the existing `/api/catalog/categories` route to return a nested tree). Subcategory destinations use the existing `/categories/[slug]?sub=<sub>` query-parameter URL scheme.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: Next.js 16.x (App Router), React 19, Square SDK 45.x, Tailwind CSS 4, Zod, Lucide React (icons), Clerk (`@clerk/nextjs` for the existing nav auth UI)

**Storage**: N/A — Square Catalog API is the sole data source

**Testing**: Vitest + @testing-library/react + @testing-library/user-event + MSW (unit/integration), Playwright (E2E)

**Target Platform**: Vercel (serverless + edge), modern evergreen browsers (desktop + mobile)

**Project Type**: Next.js App Router web application (single project, `@/*` path alias)

**Performance Goals**: Megamenu opens and becomes interactive within 200ms of activating "Shop" (SC-002); category tree served with ISR-style `Cache-Control` reuse of the existing route caching

**Constraints**: All product/category data MUST come from Square via Route Handlers (Constitution II); zero mock data in production (Constitution VII); server components first with `"use client"` only at interactive leaf nodes (Constitution I)

**Scale/Scope**: Global nav (`NavBar` + `NavBarServer`), 1 extended API route (`/api/catalog/categories`), 2 new client components (desktop megamenu, mobile drawer), 1 new server data-fetching module, 12 functional requirements, 12 Gherkin scenarios

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | ✅ PASS | `NavBarServer` (RSC) fetches the category tree and passes it to `NavBar`. Only the megamenu and mobile drawer client components use `"use client"` for open/close/drilldown interactivity — leaf nodes. |
| II | API Route Security | ✅ PASS | Category tree fetched via the existing `/api/catalog/categories` Route Handler (extended to support nesting). Square token never exposed to browser. Zod validates query params. |
| III | Type-Safe Data Flow | ✅ PASS | New hierarchical `NavCategoryNode` type in `lib/square/types.ts`; `CategoryTreeNode` already exists in `lib/square/catalog.ts`. Zod schemas for the API response. `@/*` imports throughout. |
| IV | Component Architecture | ✅ PASS | shadcn/ui-style components + Tailwind utility classes + `cn()`. New components reuse existing `Link`, `cn`, and nav styling tokens. |
| V | Performance & Caching | ✅ PASS | `/api/catalog/categories` already returns `Cache-Control: public, s-maxage=3600`. The tree is cached server-side; hover/click toggling is client-side with no extra network. |
| VI | Gherkin-First Testing (Testing Trophy) | ✅ PASS | `.feature` file exists (12 scenarios). Integration tests for megamenu open/close and mobile drilldown with MSW-mocked API; unit tests for tree-building transforms. |
| VII | No Mock Data Fallback | ✅ PASS | All categories sourced from Square via Route Handler. On API failure, `NavBar` shows no Shop menu / a graceful error state — never fabricated categories. |

## Project Structure

### Documentation (this feature)

```text
specs/036-shop-menu-drilldown/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
├── features/
│   └── shop-menu-drilldown.feature   # Gherkin scenarios (12)
└── checklists/
    └── requirements.md              # Quality checklist
```

### Source Code (repository root) — key files

```text
app/api/catalog/categories/route.ts   # EXTEND: return nested tree (add ?nested= or new shape)
lib/square/
├── types.ts                          # ADD NavCategoryNode (hierarchical), Zod schema
├── catalog.ts                        # ADD getShopCategoryTree() using buildCategoryTree()
└── data/categories.ts                # ADD getNavCategoryTree() (server data fetch via Route Handler)
components/
├── nav-bar.tsx                       # "use client": render Shop menu entry + mount megamenu/drawer
├── nav-bar-server.tsx                # RSC: fetch tree, pass to NavBar
├── shop-menu/
│   ├── shop-megamenu.tsx             # "use client": desktop full-width panel
│   ├── shop-mobile-drawer.tsx        # "use client": full-screen drawer + drilldown
│   └── __tests__/
│       └── shop-menu.test.tsx        # Integration tests (open/close, drilldown)
tests/
├── e2e/                              # Playwright E2E (Shop → category journey)
└── setup/                            # MSW handlers for /api/catalog/categories
```

**Structure Decision**: Single Next.js App Router project. The category tree is fetched once in `NavBarServer` (RSC) through the extended Route Handler and passed as props to `NavBar`. `NavBar` remains a client component (it already uses `usePathname` and Clerk hooks) and conditionally renders the desktop `ShopMegamenu` and mobile `ShopMobileDrawer` client components. Tree-building logic reuses the existing pure `buildCategoryTree()` in `lib/square/catalog.ts`, keeping transforms unit-testable without network.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. The plan reuses existing tree-building utilities and the existing Route Handler, so no unjustified complexity is introduced.