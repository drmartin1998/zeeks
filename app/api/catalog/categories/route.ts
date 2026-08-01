import { NextResponse } from "next/server";
import { catalogApi } from "@/lib/square/client";
import {
  type NavCategory,
  type SquareCatalogCategory,
  isTopLevelCategory,
  mapSquareCategoryToNavCategory,
} from "@/lib/square/types";

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
