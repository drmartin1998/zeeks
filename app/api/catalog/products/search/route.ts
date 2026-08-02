import { NextRequest, NextResponse } from "next/server";
import { catalogApi, locationId } from "@/lib/square/client";
import {
  ProductSearchParamsSchema,
  ProductSchema,
  type Product,
} from "@/lib/square/types";
import { apiSuccess, apiServerError } from "@/lib/api-helpers";
import { withRetry } from "@/lib/utils";
import { normalizePrice } from "@/lib/square/catalog";
import type { CatalogObject } from "square";

export async function GET(
  request: NextRequest
): Promise<NextResponse<{ products: Product[]; cursor?: string } | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = {
      q: searchParams.get("q") ?? "",
      cursor: searchParams.get("cursor") ?? undefined,
    };

    // Validate input with Zod
    const parsed = ProductSearchParamsSchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid search parameters" },
        { status: 400 }
      );
    }

    const { q, cursor } = parsed.data;

    // ── Search items with text query ──────────────────────────────
    const result = await withRetry(() =>
      catalogApi.searchItems({
        textFilter: q,
        enabledLocationIds: [locationId],
        cursor,
        limit: 100,
      })
    );

    const items = result.items ?? [];

    // ── Transform to Products ─────────────────────────────────────
    const products: Product[] = items
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

        // Categorize by first category reference
        const categories =
          itemData?.categories as { id?: string }[] | undefined;
        const firstCategoryId = categories?.[0]?.id ?? "";

        const product: Product = {
          id: item.id,
          title: name,
          description,
          category: firstCategoryId,
          categorySlug: "search",
          price: normalizePrice(priceMoney?.amount),
          currency: priceMoney?.currency ?? "USD",
          imageUrl: undefined,
          gradient: "from-zeeks-purple to-zeeks-purple-dark",
        };

        const validated = ProductSchema.safeParse(product);
        if (!validated.success) {
          console.warn(
            "Skipping search result that failed validation:",
            item.id,
            validated.error.issues
          );
          return null;
        }

        return validated.data;
      })
      .filter((p): p is Product => p !== null);

    return apiSuccess({ products, cursor: result.cursor });
  } catch (error) {
    console.error(
      "[GET /api/catalog/products/search] Square API error:",
      error instanceof Error ? error.message : error
    );
    return apiServerError("Search temporarily unavailable. Please try again.");
  }
}
