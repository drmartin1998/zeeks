import { HeroSection } from "@/components/hero-section";
import { FeaturedCategories } from "@/components/featured-categories";
import { FeaturedGames } from "@/components/featured-games";
import { LocalStoreHub } from "@/components/local-store-hub/local-store-hub";
import { PromoBanner } from "@/components/promo-banner";
import { Footer } from "@/components/footer";
import { sanityFetch } from "@/lib/sanity/live";
import { HOME_HERO_QUERY, type HomeHeroQueryResult } from "@/lib/sanity/queries";
import { imageUrl, type SanityImage } from "@/lib/sanity/image";
import {
  getSquareCategories,
  getSquareProductsByCategorySlug,
  type SquareProduct,
} from "@/lib/square/catalog";

export default async function Home() {
  const [hero, squareCategories, ...featuredResults] = await Promise.all([
    sanityFetch({ query: HOME_HERO_QUERY }),
    getSquareCategories(),
    getSquareProductsByCategorySlug("miniatures"),
  ]);

  const heroBlock = (hero.data as HomeHeroQueryResult | null)?.heroBlock ?? null;

  const toHref = (cta: {
    label?: string | null;
    linkType?: string | null;
    externalUrl?: string | null;
    internalSlug?: string | null;
  } | null | undefined) =>
    cta?.label
      ? {
          label: cta.label,
          href: cta.internalSlug || cta.externalUrl || "",
        }
      : null;

  const featuredGames: SquareProduct[] =
    featuredResults
      .flat()
      .filter((g): g is SquareProduct => g != null)
      .slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <main className="flex-1 overflow-x-hidden">
        <HeroSection
          eyebrow={heroBlock?.eyebrow ?? null}
          heading={heroBlock?.heading ?? null}
          subheading={heroBlock?.subheading ?? null}
          imageUrl={heroBlock?.image ? imageUrl(heroBlock.image as SanityImage) : null}
          primaryCta={toHref(heroBlock?.primaryCta)}
          secondaryCta={toHref(heroBlock?.secondaryCta)}
        />
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
        <LocalStoreHub />
        <PromoBanner />
      </main>
      <Footer />
    </div>
  );
}
