import { Suspense } from "react";
import { Footer } from "@/components/footer";
import { ProductGrid } from "@/components/product-listing/product-grid";
import { searchProductsByQuery } from "@/lib/square/catalog";
import type { DisplayProduct } from "@/lib/square/types";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  let products: DisplayProduct[] = [];
  if (query) {
    products = await searchProductsByQuery(query);
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <main className="flex-1">
        <div className="mx-auto max-w-[1440px] px-4 pt-8 md:px-8 lg:px-20">
          <h1 className="text-2xl font-bold text-gray-900">
            {query
              ? `Search results for "${query}"`
              : "Search Products"}
          </h1>
          {query && (
            <p className="mt-1 text-sm text-gray-500">
              {products.length}{" "}
              {products.length === 1 ? "result" : "results"} found
            </p>
          )}
        </div>

        {query && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 px-5 py-20">
            <p className="text-lg font-semibold text-gray-700">
              No products found for &quot;{query}&quot;
            </p>
            <p className="text-sm text-gray-500">
              Try a different search term or browse our categories.
            </p>
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </main>
      <Footer />
    </div>
  );
}