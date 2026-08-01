import { GameCard } from "@/components/game-card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface FeaturedGamesProps {
  games: {
    title: string;
    category: string;
    categorySlug: string;
    price: number;
    image: string;
    gradient: string;
  }[];
}

export function FeaturedGames({ games }: FeaturedGamesProps) {
  return (
    <section id="new-arrivals" className="w-full bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 py-12 md:gap-12 md:px-8 lg:px-20 lg:py-20">
        {/* Section header */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-[40px] font-extrabold leading-tight">
              <span style={{ color: "#7B4FA2" }}>New</span>{" "}
              <span style={{ color: "#5D5FEF" }}> </span>
              <span style={{ color: "#0E0E2C" }}>Arrivals</span>
            </h2>
          </div>
          <Link
            href="/categories/new-arrivals"
            className="flex items-center gap-1.5 text-sm font-bold transition-colors hover:opacity-80"
            style={{ color: "#E89516" }}
          >
            See All New Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Games grid */}
        {games.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {games.map((game) => (
              <GameCard
                key={game.title}
                title={game.title}
                category={game.category}
                categorySlug={game.categorySlug}
                price={game.price}
                image={game.image}
                gradient={game.gradient}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
