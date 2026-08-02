import { NextResponse } from "next/server";
import { catalogApi } from "@/lib/square/client";
import {
  type NavCategory,
  type SquareCatalogCategory,
  isTopLevelCategory,
  mapSquareCategoryToNavCategory,
} from "@/lib/square/types";

/**
 * Square category IDs that are allowed as top-level categories.
 * Mirrors ALLOWED_CATEGORY_IDS in lib/square/catalog.ts.
 */
const ALLOWED_CATEGORY_IDS = [
  "ZCZJWQX6WREDLATZFW3U7OCJ", // Miniatures
  "62G7JSXJDS4U574NW4XS4WKV", // Hobby Supplies
];

export async function GET(): Promise<NextResponse<NavCategory[] | { error: string }>> {
  try {
    const response = await catalogApi.search({
      objectTypes: ["CATEGORY"],
      includeDeletedObjects: false,
    });

    const objects = (response as { objects?: SquareCatalogCategory[] }).objects ?? [];

    const categories: NavCategory[] = objects
      .filter(
        (obj: SquareCatalogCategory): obj is SquareCatalogCategory =>
          obj.type === "CATEGORY" && !!obj.categoryData
      )
      .filter((cat) => {
        // Subcategories always pass through
        if (cat.categoryData.parentCategoryId) return true;
        // Top-level categories must be in the allowlist
        return ALLOWED_CATEGORY_IDS.includes(cat.id);
      })
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
