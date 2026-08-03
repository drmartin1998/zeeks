import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductListingPage } from "@/components/product-listing";
import {
  type SquareProduct,
  getSquareCategoryBySlug,
  getSquareProductsByCategorySlug,
  getSquareSubcategories,
} from "@/lib/square/catalog";

interface PageProps {
  params: Promise<{ category: string }>;
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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category } = await params;
  const cat = await getSquareCategoryBySlug(category);

  if (!cat) {
    return { title: "Category Not Found - Zeeks" };
  }

  return {
    title: `${cat.title} - Zeeks`,
    description: `Browse our ${cat.title.toLowerCase()} collection.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;

  const cat = await getSquareCategoryBySlug(category);

  if (!cat) {
    notFound();
  }

  const [squareProducts, subCategories] = await Promise.all([
    getSquareProductsByCategorySlug(category),
    getSquareSubcategories(category),
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
