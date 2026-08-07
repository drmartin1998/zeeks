import { http, HttpResponse } from "msw";
import type { NavCategoryNode } from "@/lib/square/types";

/**
 * MSW handlers for the catalog categories API.
 *
 * Used by integration tests that render components/Route Handlers which hit
 * `/api/catalog/categories`. The default handlers can be overridden per-test
 * with `server.use(...)`.
 */

interface CategoryTreeNode {
  label: string;
  href: string;
  children: CategoryTreeNode[];
  hasChildren: boolean;
}

/** Default nested tree used by the Shop menu in tests. */
export const mockCategoryTree: CategoryTreeNode[] = [
  {
    label: "Miniatures",
    href: "/categories/miniatures",
    hasChildren: true,
    children: [
      {
        label: "Games Workshop",
        href: "/categories/miniatures?sub=games-workshop",
        hasChildren: true,
        children: [
          {
            label: "Warhammer 40K",
            href: "/categories/miniatures?sub=warhammer-40k",
            hasChildren: false,
            children: [],
          },
        ],
      },
    ],
  },
  {
    label: "Board Games",
    href: "/categories/board-games",
    hasChildren: false,
    children: [],
  },
];

export const handlers = [
  http.get("/api/catalog/categories", ({ request }) => {
    const url = new URL(request.url);
    const nested = url.searchParams.get("nested") === "true";
    if (nested) {
      return HttpResponse.json({ tree: mockCategoryTree });
    }
    // Legacy flat shape: top-level categories only.
    return HttpResponse.json(
      mockCategoryTree.map((n) => ({ label: n.label, href: n.href }))
    );
  }),
];

export type { NavCategoryNode };