import { GameCard } from "@/components/game-card";
import type { DisplayProduct as Product } from "@/lib/square/types";

interface ProductGridProps {
  products: Product[];
  /** Render without the outer max-w/px container (for nesting in a layout column). */
  fill?: boolean;
}

export function ProductGrid({ products, fill = false }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-5 py-20 lg:px-20">
        <p className="text-lg font-semibold text-text-primary">
          No products found
        </p>
        <p className="text-sm text-text-muted">
          Try adjusting your filters or check back later for new arrivals.
        </p>
      </div>
    );
  }

  return (
    <section
      className={
        fill
          ? "w-full"
          : "mx-auto w-full max-w-[1440px] px-4 pt-12 pb-6 md:px-8 lg:px-20"
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <GameCard
            key={product.catalogObjectId ?? product.slug}
            title={product.title}
            category={product.category}
            productSlug={product.slug}
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
    </section>
  );
}
