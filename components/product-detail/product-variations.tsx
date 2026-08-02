"use client";

import type { ProductVariation } from "@/lib/square/types";

interface ProductVariationsProps {
  variations: ProductVariation[];
  onVariationChange: (variation: ProductVariation) => void;
}

export function ProductVariations({
  variations,
  onVariationChange,
}: ProductVariationsProps) {
  // Don't show if 0 or 1 variation
  if (variations.length <= 1) return null;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-gray-900">Variation</h2>
      <select
        defaultValue={variations[0]?.id}
        onChange={(e) => {
          const selected = variations.find((v) => v.id === e.target.value);
          if (selected) onVariationChange(selected);
        }}
        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 sm:w-auto"
      >
        {variations.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
            {v.price !== variations[0]?.price &&
              ` — ${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(v.price)}`}
          </option>
        ))}
      </select>
    </div>
  );
}
