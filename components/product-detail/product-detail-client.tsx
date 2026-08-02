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

  const displayPrice =
    selectedVariation.price !== product.variations[0]?.price
      ? selectedVariation.price
      : product.price;

  // Out of stock if status indicates it OR the selected variation has zero inventory
  const isOutOfStock =
    product.inventoryStatus === "OUT_OF_STOCK" ||
    (selectedVariation.inventoryCount != null && selectedVariation.inventoryCount <= 0);

  return (
    <div className="flex flex-col">
      <ProductInfo
        title={product.title}
        price={displayPrice}
        currency={product.currency}
        description={product.description}
        inventoryStatus={isOutOfStock ? "OUT_OF_STOCK" : product.inventoryStatus}
        maxQuantity={
          selectedVariation.inventoryCount != null
            ? selectedVariation.inventoryCount
            : 99
        }
      />
      <ProductVariations
        variations={product.variations}
        onVariationChange={setSelectedVariation}
      />
    </div>
  );
}
