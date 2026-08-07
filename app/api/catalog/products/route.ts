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
import { slugify, normalizePrice, fetchAllCategories, BRAND_KEY, buildSubcategoryTree, buildCategoryTree, flattenCategoryTree } from "@/lib/square/catalog";
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

    // Recursively resolve the full subtree below the parent (any depth) and
    // map every descendant category to its nearest top-level-child ancestor
    // for facet annotation. This makes deeply nested subcategories (e.g., a
    // sub-subcategory under "Games Workshop") both searchable and roll up to
    // the visible facet option.
    const { descendantIds, subByDescendantId } = buildSubcategoryTree(
      allCats,
      parentId
    );

    // Nested tree + slug-path lookup for drill-down (grandchild) filtering.
    const categoryTree = buildCategoryTree(allCats, parentId);
    const { slugPathByCategoryId } = flattenCategoryTree(categoryTree);

    // Search parent + ALL descendants (any depth)
    const allCategoryIds = [parentId, ...descendantIds];

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

    // ── Resolve product images via batchGet ────────────────────────
    // `searchItems` returns `itemData.imageIds` but not the image URL. Collect
    // every item's image IDs (item-level + variation-level fallback), fetch the
    // IMAGE objects in batches of 100, and build an id → url map. Items with no
    // images leave `imageUrl` undefined so the GameCard shows its placeholder.
    const imageIdsByItemId = new Map<string, string[]>();
    const imageIdSet = new Set<string>();

    for (const item of allItems) {
      if (item.type !== "ITEM") continue;
      const raw = item as unknown as Record<string, unknown>;
      const itemData = raw.itemData as Record<string, unknown> | undefined;
      if (!itemData) continue;

      const ids: string[] = [];
      const itemImageIds = (itemData.imageIds as string[] | undefined) ?? [];
      ids.push(...itemImageIds);

      const variations =
        (itemData.variations as Record<string, unknown>[] | undefined) ?? [];
      for (const v of variations) {
        const vData = v?.itemVariationData as Record<string, unknown> | undefined;
        const varImageIds = (vData?.imageIds as string[] | undefined) ?? [];
        ids.push(...varImageIds);
      }

      if (ids.length > 0) {
        imageIdsByItemId.set(item.id, ids);
        for (const id of ids) imageIdSet.add(id);
      }
    }

    const imageUrlById = new Map<string, string>();
    const allImageIds = [...imageIdSet];
    for (let i = 0; i < allImageIds.length; i += 100) {
      const chunk = allImageIds.slice(i, i + 100);
      const res = await withRetry(() =>
        catalogApi.batchGet({ objectIds: chunk })
      );
      const objects = res.objects ?? [];
      for (const obj of objects) {
        const objRaw = obj as unknown as Record<string, unknown>;
        if (obj.type === "IMAGE" && objRaw.imageData) {
          const imgData = objRaw.imageData as Record<string, unknown>;
          const url = imgData.url as string | undefined;
          if (url) imageUrlById.set(obj.id, url);
        }
      }
    }

    const resolvePrimaryImage = (itemId: string): string | undefined => {
      const ids = imageIdsByItemId.get(itemId) ?? [];
      for (const id of ids) {
        const url = imageUrlById.get(id);
        if (url) return url;
      }
      return undefined;
    };

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
        let subCategorySlugs: string[] | undefined;
        const categories =
          itemData?.categories as { id?: string }[] | undefined;
        if (categories) {
          for (const catRef of categories) {
            if (catRef.id && subByDescendantId.has(catRef.id)) {
              const sub = subByDescendantId.get(catRef.id)!;
              subCategory = sub.name;
              subCategorySlug = sub.slug;
              subCategorySlugs =
                slugPathByCategoryId.get(catRef.id) ?? [sub.slug];
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
          subCategorySlugs,
          price: normalizePrice(priceMoney?.amount),
          currency: priceMoney?.currency ?? "USD",
          imageUrl: resolvePrimaryImage(item.id),
          gradient: "from-zeeks-purple to-zeeks-purple-dark",
          brand: ((itemData?.customAttributeValues as Record<string, unknown> | undefined)?.[BRAND_KEY] as { stringValue?: string | null } | undefined)?.stringValue ?? undefined,
          availability: variations.some((v) => {
            const vData = v?.itemVariationData as Record<string, unknown> | undefined;
            const overrides =
              (vData?.locationOverrides as Record<string, unknown>[] | undefined) ?? [];
            const override = overrides.find((o) => o.locationId === locationId) ?? overrides[0];
            return !(override?.soldOut as boolean | undefined);
          })
            ? "IN_STOCK"
            : "OUT_OF_STOCK",
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
