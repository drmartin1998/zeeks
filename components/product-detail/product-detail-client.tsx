"use client";

import { useState } from "react";
import { ProductInfo } from "@/components/product-detail/product-info";
import { ProductVariations } from "@/components/product-detail/product-variations";
import type { ProductDetail, ProductVariation } from "@/lib/square/types";

interface ProductDetailClientProps {
  product: ProductDetail;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation>(
    product.variations[0] ?? { id: "", name: "Default", price: product.price }
  );
  const [quantity, setQuantity] = useState(1);

  const displayPrice =
    selectedVariation.price !== product.variations[0]?.price
      ? selectedVariation.price
      : product.price;

  const variantInventoryStatus: "IN_STOCK" | "OUT_OF_STOCK" | "UNKNOWN" =
    selectedVariation.inventoryCount != null
      ? selectedVariation.inventoryCount > 0
        ? "IN_STOCK"
        : "OUT_OF_STOCK"
      : selectedVariation.isSoldOut != null
        ? selectedVariation.isSoldOut
          ? "OUT_OF_STOCK"
          : "IN_STOCK"
        : product.inventoryStatus;

  const isOutOfStock = variantInventoryStatus === "OUT_OF_STOCK";

  return (
    <div className="flex flex-col">
      <ProductInfo
        title={product.title}
        price={displayPrice}
        currency={product.currency}
        description={product.description}
        inventoryStatus={variantInventoryStatus}
        maxQuantity={
          selectedVariation.isSoldOut
            ? 0
            : selectedVariation.inventoryCount != null
              ? selectedVariation.inventoryCount
              : 99
        }
        catalogObjectId={selectedVariation.id || product.id}
        variationId={selectedVariation.id || ""}
        quantity={quantity}
        onQuantityChange={setQuantity}
      />
      <ProductVariations
        variations={product.variations}
        onVariationChange={setSelectedVariation}
      />
    </div>
  );
}
