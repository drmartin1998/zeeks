import { NextRequest, NextResponse } from "next/server";
import { catalogApi } from "@/lib/square/client";
import { ProductSchema, type Product } from "@/lib/square/types";
import { apiSuccess, apiNotFound, apiServerError } from "@/lib/api-helpers";
import { withRetry } from "@/lib/utils";
import { normalizePrice } from "@/lib/square/catalog";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<Product | { error: string }>> {
  try {
    const { id } = await params;

    if (!id || id.trim().length === 0) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // ── Retrieve single catalog object via batchGet ───────────────
    const response = await withRetry(() =>
      catalogApi.batchGet({ objectIds: [id] })
    );

    const objects = response.objects ?? [];
    const obj = objects[0];

    if (!obj || obj.type !== "ITEM") {
      return apiNotFound("Product not found");
    }

    const raw = obj as unknown as Record<string, unknown>;
    const itemData = raw.itemData as Record<string, unknown> | undefined;

    if (!itemData) {
      return apiNotFound("Product not found");
    }

    const name = (itemData.name as string) ?? "Untitled";
    const description = itemData.description as string | undefined;
    const variations = (itemData.variations as Record<string, unknown>[]) ?? [];
    const firstVariation = variations[0];
    const varData =
      firstVariation?.itemVariationData as
        | Record<string, unknown>
        | undefined;
    const priceMoney = varData?.priceMoney as
      | { amount?: bigint; currency?: string }
      | undefined;

    const product: Product = {
      id: obj.id,
      title: name,
      description,
      category: "",
      categorySlug: "",
      price: normalizePrice(priceMoney?.amount),
      currency: priceMoney?.currency ?? "USD",
      imageUrl: undefined,
      gradient: "from-zeeks-purple to-zeeks-purple-dark",
    };

    const validated = ProductSchema.safeParse(product);
    if (!validated.success) {
      return apiServerError("Product data validation failed");
    }

    return apiSuccess(validated.data);
  } catch (error) {
    console.error(
      "[GET /api/catalog/products/[id]] Square API error:",
      error instanceof Error ? error.message : error
    );
    return apiServerError("Product details temporarily unavailable.");
  }
}
