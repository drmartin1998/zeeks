import { NextRequest, NextResponse } from "next/server";
import { catalogApi, locationId } from "@/lib/square/client";
import {
  isTopLevelCategory,
  SearchParamsSchema,
  ProductSchema,
  type Product,
} from "@/lib/square/types";
import { apiSuccess, apiNotFound, apiServerError } from "@/lib/api-helpers";
import { withRetry } from "@/lib/utils";
import { slugify, normalizePrice, fetchAllCategories } from "@/lib/square/catalog";
import type { CatalogObject } from "square";

export async function GET(
  request: NextRequest
): Promise<NextResponse<Product[] | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = {
      slug: searchParams.get("slug") ?? "",
      cursor: searchParams.get("cursor") ?? undefined,
    };

    // Validate input with Zod
    const parsed = SearchParamsSchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid parameters" },
        { status: 400 }
      );
    }

    const { slug } = parsed.data;

    // ── Resolve slug → parent category + subcategories ──────────────
    // Delegates channel filter + online visibility + allowlist to the
    // shared fetchAllCategories() — no duplicated filter logic here.
    const allCats = await withRetry(() => fetchAllCategories());

    const parent = allCats
      .filter(isTopLevelCategory)
      .find((cat) => slugify(cat.categoryData.name) === slug);

    if (!parent) {
      return apiNotFound("Category not found");
    }

    const parentId = parent.id;
    const parentName = parent.categoryData.name;

    // Build subcategory map for annotation
    const subCategoryMap = new Map<
      string,
      { id: string; name: string; slug: string }
    >();
    for (const cat of allCats) {
      if (
        !isTopLevelCategory(cat) &&
        cat.categoryData.parentCategory?.id === parentId
      ) {
        subCategoryMap.set(cat.id, {
          id: cat.id,
          name: cat.categoryData.name,
          slug: slugify(cat.categoryData.name),
        });
      }
    }

    const allCategoryIds = [parentId, ...subCategoryMap.keys()];

    // ── Search items with cursor-based pagination ──────────────────
    const allItems: CatalogObject[] = [];
    let cursor: string | undefined;

    do {
      const result = await withRetry(() =>
        catalogApi.searchItems({
          categoryIds: allCategoryIds,
          enabledLocationIds: [locationId],
          cursor,
          limit: 100,
        })
      );

      if (result.items) {
        allItems.push(...result.items);
      }
      cursor = result.cursor;
    } while (cursor);

    // ── Transform to Products ─────────────────────────────────────
    const products: Product[] = allItems
      .filter(
        (item): item is CatalogObject.Item =>
          item.type === "ITEM" &&
          !!(item as unknown as Record<string, unknown>).itemData
      )
      .map((item) => {
        const raw = item as unknown as Record<string, unknown>;
        const itemData = raw.itemData as Record<string, unknown> | undefined;
        const name = (itemData?.name as string) ?? "Untitled";
        const description = itemData?.description as string | undefined;
        const variations =
          (itemData?.variations as Record<string, unknown>[]) ?? [];
        const firstVariation = variations[0];
        const varData =
          firstVariation?.itemVariationData as
            | Record<string, unknown>
            | undefined;
        const priceMoney = varData?.priceMoney as
          | { amount?: bigint; currency?: string }
          | undefined;

        // Determine subcategory
        let subCategory: string | undefined;
        let subCategorySlug: string | undefined;
        const categories =
          itemData?.categories as { id?: string }[] | undefined;
        if (categories) {
          for (const catRef of categories) {
            if (catRef.id && subCategoryMap.has(catRef.id)) {
              const sub = subCategoryMap.get(catRef.id)!;
              subCategory = sub.name;
              subCategorySlug = sub.slug;
              break;
            }
          }
        }

        const product: Product = {
          id: item.id,
          title: name,
          description,
          category: parentName,
          categorySlug: slug,
          subCategory,
          subCategorySlug,
          price: normalizePrice(priceMoney?.amount),
          currency: priceMoney?.currency ?? "USD",
          imageUrl: undefined,
          gradient: "from-zeeks-purple to-zeeks-purple-dark",
        };

        // Validate with Zod before returning
        const validated = ProductSchema.safeParse(product);
        if (!validated.success) {
          console.warn(
            "Skipping product that failed validation:",
            item.id,
            validated.error.issues
          );
          return null;
        }

        return validated.data;
      })
      .filter((p): p is Product => p !== null);

    return apiSuccess(products);
  } catch (error) {
    console.error(
      "[GET /api/catalog/products] Square API error:",
      error instanceof Error ? error.message : error
    );
    return apiServerError("Products temporarily unavailable. Please try again.");
  }
}
