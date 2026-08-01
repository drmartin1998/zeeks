import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListingPage } from "@/components/product-listing";
import { getNavCategories } from "@/lib/data/categories";
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
    image: sp.image || undefined,
    gradient: sp.gradient,
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

  const [navCategories, squareProducts, subCategories] = await Promise.all([
    getNavCategories(),
    getSquareProductsByCategorySlug(category),
    getSquareSubcategories(category),
  ]);

  const products = (squareProducts ?? []).map(toProduct);

  return (
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
  );
}
