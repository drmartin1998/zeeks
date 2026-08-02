import { GameCard } from "@/components/game-card";
import type { DisplayProduct as Product } from "@/lib/square/types";

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
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
    <section className="w-full px-5 pt-12 pb-6 lg:px-20">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <GameCard
            key={product.slug}
            title={product.title}
            category={product.category}
            price={product.price}
            image={product.image}
            gradient={product.gradient}
          />
        ))}
      </div>
    </section>
  );
}
