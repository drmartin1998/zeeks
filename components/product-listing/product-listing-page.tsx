"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { CategoryHero } from "@/components/product-listing/category-hero";
import { FilterBar } from "@/components/product-listing/filter-bar";
import { ProductGrid } from "@/components/product-listing/product-grid";
import { Pagination } from "@/components/product-listing/pagination";
import type { NavCategory, CategoryDisplayData as CategoryData } from "@/lib/square/types";
import type { SquareSubCategory } from "@/lib/square/catalog";

interface ProductListingPageProps {
  category: CategoryData;
  navCategories: NavCategory[];
  /** Products for this category — always required (fetched from Square). */
  products: { slug: string; title: string; category: string; subCategory?: string; subCategorySlug?: string; price: number; image?: string; gradient?: string }[];
  /** Subcategories for filtering */
  subCategories?: SquareSubCategory[];
}

const ITEMS_PER_PAGE = 12;

export function ProductListingPage({
  category,
  navCategories,
  products: allProducts,
  subCategories,
}: ProductListingPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial filter from URL
  const initialSub = searchParams.get("sub");
  const [activeFilters, setActiveFilters] = useState<string[]>(
    initialSub && subCategories?.some((s) => s.slug === initialSub)
      ? [initialSub]
      : []
  );
  const [currentSort, setCurrentSort] = useState("Featured");
  const [currentPage, setCurrentPage] = useState(1);

  // Apply subcategory filtering
  const filteredProducts = useMemo(() => {
    if (activeFilters.length === 0) return allProducts;
    return allProducts.filter(
      (p) => p.subCategorySlug && activeFilters.includes(p.subCategorySlug)
    );
  }, [allProducts, activeFilters]);

  // Apply sorting
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    switch (currentSort) {
      case "Price: Low to High":
        return sorted.sort((a, b) => a.price - b.price);
      case "Price: High to Low":
        return sorted.sort((a, b) => b.price - a.price);
      case "Newest":
      case "Featured":
      default:
        return sorted;
    }
  }, [filteredProducts, currentSort]);

  // Apply pagination
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = sortedProducts.slice(
    startIndex,
    safePage * ITEMS_PER_PAGE
  );
  const showingStart = sortedProducts.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(startIndex + paginatedProducts.length, sortedProducts.length);

  const handleFilterToggle = (filter: string) => {
    if (filter === "__all__") {
      setActiveFilters([]);
      router.push("?", { scroll: false });
    } else {
      // Compute next value OUTSIDE the setState updater so router.push
      // is NOT called during React's render phase (avoids "Cannot update
      // a component while rendering a different component").
      const next = activeFilters.includes(filter)
        ? activeFilters.filter((f) => f !== filter)
        : [...activeFilters, filter];
      setActiveFilters(next);
      // Update URL with comma-separated active filters
      if (next.length > 0) {
        router.push(`?sub=${next.join(",")}`, { scroll: false });
      } else {
        router.push("?", { scroll: false });
      }
    }
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    setCurrentSort(sort);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <NavBar categories={navCategories} />
      <main className="flex-1 overflow-x-hidden">
        <CategoryHero
          categoryName={category.name}
          description={category.description}
          backgroundImage={category.backgroundImage}
        />
        <FilterBar
          totalResults={filteredProducts.length}
          showingStart={showingStart}
          showingEnd={showingEnd}
          activeFilters={activeFilters}
          currentSort={currentSort}
          onFilterToggle={handleFilterToggle}
          onSortChange={handleSortChange}
          subCategories={subCategories?.map((s) => ({ slug: s.slug, name: s.name }))}
        />
        <ProductGrid products={paginatedProducts} />
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </main>
      <Footer />
    </div>
  );
}
