import { NextResponse } from "next/server";
import {
  type NavCategory,
  isTopLevelCategory,
  mapSquareCategoryToNavCategory,
} from "@/lib/square/types";
import { fetchAllCategories } from "@/lib/square/catalog";

export async function GET(): Promise<NextResponse<NavCategory[] | { error: string }>> {
  try {
    // Delegates channel filter + online visibility + allowlist to the
    // shared fetchAllCategories() — no duplicated filter logic here.
    const objects = await fetchAllCategories();

    const categories: NavCategory[] = objects
      .filter(isTopLevelCategory)
      .map(mapSquareCategoryToNavCategory);

    return NextResponse.json(categories, {
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch categories";
    console.error("Square Catalog API error:", message);

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
