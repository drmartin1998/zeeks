import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductListingPage } from "@/components/product-listing";
import {
  getSquareCategoryBySlug,
  getSquareProductsByCategorySlug,
  getSquareSubcategories,
  type SquareProduct,
} from "@/lib/square/catalog";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

function toProduct(sp: SquareProduct) {
  return {
    slug: sp.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    title: sp.title,
    category: sp.category,
    subCategory: sp.subCategory,
    subCategorySlug: sp.subCategorySlug,
    price: sp.price,
    minPrice: sp.minPrice,
    maxPrice: sp.maxPrice,
    image: sp.image || undefined,
    gradient: sp.gradient,
    catalogObjectId: sp.catalogObjectId,
    variationId: sp.variationId,
    hasVariations: sp.hasVariations,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const cat = await getSquareCategoryBySlug(slug);

  if (!cat) {
    notFound();
  }

  const [squareProducts, subCategories] = await Promise.all([
    getSquareProductsByCategorySlug(slug),
    getSquareSubcategories(slug),
  ]);

  const products = (squareProducts ?? []).map(toProduct);

  return (
    <Suspense fallback={<div className="py-20 text-center text-text-muted">Loading...</div>}>
      <ProductListingPage
        category={{
          slug: cat.slug,
          name: cat.title,
          description: `Browse our full collection of ${cat.title.toLowerCase()} products.`,
          backgroundImage: cat.image,
        }}
        products={products}
        subCategories={subCategories}
      />
    </Suspense>
  );
}
