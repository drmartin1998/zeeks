import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCategoryBySlug, getProductsByCategorySlug } from "@/lib/data";
import { GameCard } from "@/components/game-card";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  const products = getProductsByCategorySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <NavBar />
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

        {/* Products grid */}
        <section className="w-full bg-white">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 py-12 md:px-8 lg:px-20 lg:py-16">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {products.map((product) => (
                  <GameCard
                    key={product.title}
                    title={product.title}
                    category={product.category}
                    categorySlug={product.categorySlug}
                    price={product.price}
                    image={product.image}
                    gradient={product.gradient}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-20 text-center">
                <p className="text-lg" style={{ color: "#6B6B8A" }}>
                  No products found in this category yet.
                </p>
                <Link
                  href="/"
                  className="text-sm font-semibold transition-colors hover:opacity-80"
                  style={{ color: "#7B4FA2" }}
                >
                  ← Back to Home
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
