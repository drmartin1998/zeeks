import type { InventoryStatus } from "@/lib/square/types";
import { QuantityPicker } from "@/components/product-detail/quantity-picker";
import { AddToCartForm } from "@/components/cart/add-to-cart-form";

interface ProductInfoProps {
  title: string;
  price: number;
  currency: string;
  description?: string;
  descriptionHtml?: string;
  inventoryStatus: InventoryStatus;
  maxQuantity?: number;
  catalogObjectId?: string;
  variationId?: string;
  quantity?: number;
  onQuantityChange?: (qty: number) => void;
}

export function ProductInfo({
  title,
  price,
  currency,
  description,
  descriptionHtml,
  inventoryStatus,
  maxQuantity = 99,
  catalogObjectId,
  variationId,
  quantity = 1,
  onQuantityChange,
}: ProductInfoProps) {
  const isOutOfStock = inventoryStatus === "OUT_OF_STOCK";
  const isInStock = inventoryStatus === "IN_STOCK";

  return (
    <div className="flex flex-col">
      {/* Title */}
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {title}
      </h1>

      {/* Price */}
      <p className="mt-3 text-2xl font-semibold text-zeeks-purple">
        {new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency,
        }).format(price)}
      </p>

      {/* Description */}
      {(description || descriptionHtml) && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-900">Description</h2>
          {descriptionHtml ? (
            <div
              className="prose prose-sm mt-2 max-w-none text-gray-600"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          ) : description ? (
            <p className="mt-2 whitespace-pre-line text-gray-600">
              {description}
            </p>
          ) : null}
        </div>
      )}

      {/* Quantity Picker */}
      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Quantity
        </label>
        <QuantityPicker
          min={1}
          max={maxQuantity}
          defaultValue={quantity}
          disabled={isOutOfStock}
          onChange={onQuantityChange}
        />
      </div>

      {/* Add to Cart Button */}
      <div className="mt-4 w-full">
        {catalogObjectId ? (
          <AddToCartForm
            catalogObjectId={catalogObjectId}
            variationId={variationId && variationId !== catalogObjectId ? variationId : ""}
            quantity={quantity}
            outOfStock={isOutOfStock}
            disabled={!isOutOfStock && !catalogObjectId}
            className="w-full"
            size="xl"
          />
        ) : (
          <AddToCartForm
            catalogObjectId=""
            variationId=""
            quantity={1}
            disabled
            outOfStock={isOutOfStock}
            className="w-full"
            size="xl"
          />
        )}
      </div>

      {/* Availability */}
      <div className="mt-4 flex items-center gap-2">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            isInStock ? "bg-green-500" : "bg-gray-400"
          }`}
          aria-hidden="true"
        />
        <span className="text-sm text-gray-600">
          {isInStock
            ? "In Stock — Ready to Ship"
            : isOutOfStock
              ? "Out of Stock"
              : "Availability Unknown"}
        </span>
      </div>
    </div>
  );
}
