import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductListingPage } from "@/components/product-listing";
import { getNavCategories } from "@/lib/data/categories";
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
    image: sp.image || undefined,
    gradient: sp.gradient,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const cat = await getSquareCategoryBySlug(slug);

  if (!cat) {
    notFound();
  }

  const [navCategories, squareProducts, subCategories] = await Promise.all([
    getNavCategories(),
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
        navCategories={navCategories}
        products={products}
        subCategories={subCategories}
      />
    </Suspense>
  );
}
