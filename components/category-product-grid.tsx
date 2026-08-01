"use client";

import { useState, useMemo } from "react";
import { GameCard } from "@/components/game-card";
import type { SquareProduct, SquareSubCategory } from "@/lib/square/catalog";
import Link from "next/link";

interface Props {
  products: SquareProduct[];
  subCategories: SquareSubCategory[];
}

export function CategoryProductGrid({ products, subCategories }: Props) {
  const [activeSub, setActiveSub] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    if (!activeSub) return products;
    return products.filter((p) => p.subCategorySlug === activeSub);
  }, [products, activeSub]);

  return (
    <div className="flex flex-col gap-8">
      {/* Subcategory filter chips */}
      {subCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveSub(null)}
            className={`inline-flex h-[35px] items-center rounded-md px-4 text-[13px] font-semibold transition-colors ${
              activeSub === null
                ? "bg-action-secondary text-white"
                : "bg-surface-secondary text-text-muted hover:text-text-primary"
            }`}
          >
            All
          </button>
          {subCategories.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSub(sub.slug)}
              className={`inline-flex h-[35px] items-center rounded-md px-4 text-[13px] font-semibold transition-colors ${
                activeSub === sub.slug
                  ? "bg-action-secondary text-white"
                  : "bg-surface-secondary text-text-muted hover:text-text-primary"
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* Product grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {filteredProducts.map((product) => (
            <GameCard
              key={product.title}
              title={product.title}
              category={
                product.subCategory
                  ? `${product.category} — ${product.subCategory}`
                  : product.category
              }
              categorySlug={product.subCategorySlug ?? product.categorySlug}
              price={product.price}
              image={product.image}
              gradient={product.gradient}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-lg" style={{ color: "#6B6B8A" }}>
            No products found in this category yet.
          </p>
          <Link
            href="/"
            className="text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: "#7B4FA2" }}
          >
            ← Back to Home
          </Link>
        </div>
      )}
    </div>
  );
}