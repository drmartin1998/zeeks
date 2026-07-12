import { NavBar } from "@/components/nav-bar";
import { HeroSection } from "@/components/hero-section";
import { FeaturedCategories } from "@/components/featured-categories";
import { FeaturedGames } from "@/components/featured-games";
import { PromoBanner } from "@/components/promo-banner";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <NavBar />
      <main className="flex-1 overflow-x-hidden">
        <HeroSection />
        <FeaturedCategories />
        <FeaturedGames />
        <PromoBanner />
      </main>
      <Footer />
    </div>
  );
}
