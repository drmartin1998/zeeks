"use client";

import { useState, useMemo } from "react";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { CategoryHero } from "@/components/product-listing/category-hero";
import { FilterBar } from "@/components/product-listing/filter-bar";
import { ProductGrid } from "@/components/product-listing/product-grid";
import { Pagination } from "@/components/product-listing/pagination";
import type { NavCategory } from "@/lib/square/types";
import {
  type CategoryData,
  getProductsByCategory,
} from "@/lib/data/products";

interface ProductListingPageProps {
  category: CategoryData;
  navCategories?: NavCategory[];
}

const ITEMS_PER_PAGE = 12;

export function ProductListingPage({ category, navCategories }: ProductListingPageProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [currentSort, setCurrentSort] = useState("Featured");
  const [currentPage, setCurrentPage] = useState(1);

  const allProducts = useMemo(
    () => getProductsByCategory(category.slug),
    [category.slug]
  );

  // Apply sorting
  const sortedProducts = useMemo(() => {
    const sorted = [...allProducts];
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
  }, [allProducts, currentSort]);

  // Apply pagination
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = sortedProducts.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const handleFilterToggle = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
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
          totalResults={allProducts.length}
          showingCount={paginatedProducts.length}
          activeFilters={activeFilters}
          currentSort={currentSort}
          onFilterToggle={handleFilterToggle}
          onSortChange={handleSortChange}
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
