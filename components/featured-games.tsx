import { GameCard } from "@/components/game-card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const FEATURED_GAMES = [
  {
    title: "Leviathan Starter Set",
    category: "Warhammer 40K",
    price: 210.0,
    players: "2",
    image: "/games/leviathan.png",
    gradient: "from-slate-700 to-slate-900",
  },
  {
    title: "Kill Team: Hivestorm",
    category: "Warhammer 40K",
    price: 160.0,
    players: "2",
    image: "/games/hivestorm.png",
    gradient: "from-emerald-700 to-emerald-900",
  },
  {
    title: "MTG Foundations Starter",
    category: "Collectible Card Game",
    price: 59.99,
    players: "2-4",
    image: "/games/foundations.png",
    gradient: "from-amber-600 to-red-800",
  },
  {
    title: "Pokémon 151 Elite Trainer",
    category: "Collectible Card Game",
    price: 49.99,
    players: "2",
    image: "/games/pokemon.jpg",
    gradient: "from-blue-600 to-indigo-800",
  },
];

export function FeaturedGames() {
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
            href="#"
            className="flex items-center gap-1.5 text-sm font-bold transition-colors hover:opacity-80"
            style={{ color: "#E89516" }}
          >
            See All New Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Games grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {FEATURED_GAMES.map((game) => (
            <GameCard
              key={game.title}
              title={game.title}
              category={game.category}
              price={game.price}
              players={game.players}
              image={game.image}
              gradient={game.gradient}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
