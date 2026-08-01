import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getSquareCategoryBySlug,
  getSquareProductsByCategorySlug,
  getSquareSubcategories,
} from "@/lib/square/catalog";
import { CategoryProductGrid } from "@/components/category-product-grid";
import { NavBarServer } from "@/components/nav-bar-server";
import { Footer } from "@/components/footer";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const [category, products, subCategories] = await Promise.all([
    getSquareCategoryBySlug(slug),
    getSquareProductsByCategorySlug(slug),
    getSquareSubcategories(slug),
  ]);

  if (!category) {
    notFound();
  }

  const safeProducts = products ?? [];

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <NavBarServer />
      <main className="flex-1 overflow-x-hidden">
        {/* Breadcrumb + header */}
        <section className="w-full" style={{ backgroundColor: "#F5F3FF" }}>
          <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-8 md:px-8 lg:px-20 lg:py-12">
            {/* Back link */}
            <Link
              href="/"
              className="flex w-fit items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: "#7B4FA2" }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>

            {/* Category title */}
            <div className="flex flex-col gap-2">
              <h1 className="font-heading text-[40px] font-extrabold leading-tight" style={{ color: "#0E0E2C" }}>
                {category.title}
              </h1>
              <p style={{ color: "#E89516" }}>
                Browse our full collection of {category.title.toLowerCase()} products.
              </p>
            </div>
          </div>
        </section>

        {/* Products grid with subcategory filter */}
        <section className="w-full bg-white">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 py-12 md:px-8 lg:px-20 lg:py-16">
            <CategoryProductGrid
              products={safeProducts}
              subCategories={subCategories}
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
