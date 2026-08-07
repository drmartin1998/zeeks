import { NextRequest, NextResponse } from "next/server";
import {
  type NavCategory,
  type NavCategoryNode,
  CategoryTreeSchema,
  isTopLevelCategory,
  mapSquareCategoryToNavCategory,
} from "@/lib/square/types";
import { buildNavCategoryTree, fetchAllCategories } from "@/lib/square/catalog";

export async function GET(
  request: NextRequest
): Promise<
  NextResponse<NavCategory[] | { tree: NavCategoryNode[] } | { error: string }>
> {
  try {
    // Delegates channel filter + online visibility + allowlist to the
    // shared fetchAllCategories() — no duplicated filter logic here.
    const objects = await fetchAllCategories();

    // When ?nested=true, return a hierarchical tree for the Shop menu.
    const nested = request.nextUrl.searchParams.get("nested") === "true";
    if (nested) {
      const tree = buildNavCategoryTree(objects);
      // Validate the tree shape before returning (Constitution III).
      CategoryTreeSchema.parse({ tree });
      return NextResponse.json({ tree }, treeCacheHeaders);
    }

    const categories: NavCategory[] = objects
      .filter(isTopLevelCategory)
      .map(mapSquareCategoryToNavCategory);

    return NextResponse.json(categories, treeCacheHeaders);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch categories";
    console.error("Square Catalog API error:", message);

    return NextResponse.json({ error: message }, { status: 502 });
  }
}

const treeCacheHeaders: { headers: Record<string, string> } = {
  headers: {
    "Cache-Control":
      "public, s-maxage=3600, stale-while-revalidate=86400",
  },
};
