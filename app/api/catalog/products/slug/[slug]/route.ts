import { NextRequest, NextResponse } from "next/server";
import { ProductDetailSchema, type ProductDetail } from "@/lib/square/types";
import { apiSuccess, apiNotFound, apiServerError } from "@/lib/api-helpers";
import { getProductDetailBySlug } from "@/lib/square/catalog";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<ProductDetail | { error: string }>> {
  try {
    const { slug } = await params;

    if (!slug || slug.trim().length === 0) {
      return NextResponse.json(
        { error: "Product slug is required" },
        { status: 400 }
      );
    }

    const product = await getProductDetailBySlug(slug.trim().toLowerCase());

    if (!product) {
      return apiNotFound("Product not found");
    }

    const validated = ProductDetailSchema.safeParse(product);
    if (!validated.success) {
      console.error(
        "[GET /api/catalog/products/slug/[slug]] Validation failed:",
        validated.error.issues
      );
      return apiServerError("Product data validation failed");
    }

    return apiSuccess(validated.data);
  } catch (error) {
    console.error(
      "[GET /api/catalog/products/slug/[slug]] Square API error:",
      error instanceof Error ? error.message : error
    );
    return apiServerError("Product details temporarily unavailable.");
  }
}
