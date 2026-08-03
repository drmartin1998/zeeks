import { HeroSection } from "@/components/hero-section";
import { FeaturedCategories } from "@/components/featured-categories";
import { FeaturedGames } from "@/components/featured-games";
import { PromoBanner } from "@/components/promo-banner";
import { Footer } from "@/components/footer";
import {
  getSquareCategories,
  getSquareProductsByCategorySlug,
  type SquareProduct,
} from "@/lib/square/catalog";

export default async function Home() {
  const [squareCategories, ...featuredResults] = await Promise.all([
    getSquareCategories(),
    getSquareProductsByCategorySlug("miniatures"),
  ]);

  const featuredGames: SquareProduct[] =
    featuredResults
      .flat()
      .filter((g): g is SquareProduct => g != null)
      .slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <main className="flex-1 overflow-x-hidden">
        <HeroSection />
        {squareCategories.length > 0 && (
          <FeaturedCategories
            categories={squareCategories.map((c) => ({
              title: c.title,
              image: c.image,
              href: c.href,
            }))}
          />
        )}
        {featuredGames.length > 0 && (
          <FeaturedGames
            games={featuredGames.map((g) => ({
              title: g.title,
              category: g.category,
              categorySlug: g.categorySlug,
              price: g.price,
              minPrice: g.minPrice,
              maxPrice: g.maxPrice,
              image: g.image,
              gradient: g.gradient,
              catalogObjectId: g.catalogObjectId,
              variationId: g.variationId,
              hasVariations: g.hasVariations,
            }))}
          />
        )}
        <PromoBanner />
      </main>
      <Footer />
    </div>
  );
}
