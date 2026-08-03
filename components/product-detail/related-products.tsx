import { GameCard } from "@/components/game-card";
import { slugify } from "@/lib/square/catalog";
import type { Product } from "@/lib/square/types";

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        Related Products
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <GameCard
            key={product.id}
            title={product.title}
            category={product.category}
            categorySlug={product.categorySlug}
            productSlug={slugify(product.title)}
            price={product.price}
            image={product.imageUrl}
            gradient={product.gradient}
            catalogObjectId={product.id}
            variationId=""
          />
        ))}
      </div>
    </section>
  );
}
