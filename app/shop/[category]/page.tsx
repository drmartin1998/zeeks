import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListingPage } from "@/components/product-listing";
import { CATEGORIES } from "@/lib/data/products";
import { getNavCategories } from "@/lib/data/categories";

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({
    category: cat.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category } = await params;
  const cat = CATEGORIES.find((c) => c.slug === category);

  if (!cat) {
    return { title: "Category Not Found - Zeeks" };
  }

  return {
    title: `${cat.name} - Zeeks`,
    description: cat.description,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const cat = CATEGORIES.find((c) => c.slug === category);

  if (!cat) {
    notFound();
  }

  const navCategories = await getNavCategories();

  return <ProductListingPage category={cat!} navCategories={navCategories} />;
}
