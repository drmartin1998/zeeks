"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GameCard } from "@/components/game-card";
import { Pagination } from "@/components/product-listing/pagination";
import type { SquareProduct, SquareSubCategory } from "@/lib/square/catalog";
import Link from "next/link";

const ITEMS_PER_PAGE = 12;

interface Props {
  products: SquareProduct[];
  subCategories: SquareSubCategory[];
}

export function CategoryProductGrid({ products, subCategories }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial filter from URL
  const initialSub = searchParams.get("sub");
  const [activeSub, setActiveSub] = useState<string | null>(
    initialSub && subCategories.some((s) => s.slug === initialSub)
      ? initialSub
      : null
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Apply subcategory filter
  const filteredProducts = useMemo(() => {
    if (!activeSub) return products;
    return products.filter((p) => p.subCategorySlug === activeSub);
  }, [products, activeSub]);

  // Apply pagination (after filtering)
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  // Update URL when chip is clicked
  const handleChipClick = (subSlug: string | null) => {
    setActiveSub(subSlug);
    setCurrentPage(1);
    if (subSlug) {
      router.push(`?sub=${subSlug}`, { scroll: false });
    } else {
      router.push("?", { scroll: false });
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Subcategory filter chips */}
      {subCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleChipClick(null)}
            aria-pressed={activeSub === null}
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
              onClick={() => handleChipClick(sub.slug)}
              aria-pressed={activeSub === sub.slug}
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
      {activeSub && filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-lg" style={{ color: "#6B6B8A" }}>
            No products in this subcategory
          </p>
          <button
            onClick={() => handleChipClick(null)}
            className="text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: "#7B4FA2" }}
          >
            Show all
          </button>
        </div>
      ) : filteredProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {paginatedProducts.map((product) => (
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
                minPrice={product.minPrice}
                maxPrice={product.maxPrice}
                image={product.image}
                gradient={product.gradient}
                catalogObjectId={product.catalogObjectId}
                variationId={product.variationId}
                hasVariations={product.hasVariations}
              />
            ))}
          </div>
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
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