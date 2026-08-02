/** TEST-ONLY: Not for production use. */

export interface Product {
  slug: string;
  title: string;
  category: string;
  price: number;
  image?: string;
  gradient?: string;
}

export interface CategoryData {
  slug: string;
  name: string;
  description: string;
  backgroundImage?: string;
}

export const CATEGORIES: CategoryData[] = [
  {
    slug: "board-games",
    name: "Board Games",
    description:
      "Gather around the table. Explore thousands of cooperative, strategic, and classic titles.",
    backgroundImage: "/images/cat-warhammer.jpg",
  },
  {
    slug: "miniatures",
    name: "Miniatures",
    description:
      "Build, paint, and command your armies. The world's best miniature wargames.",
    backgroundImage: "/images/cat-warhammer.jpg",
  },
  {
    slug: "card-games",
    name: "Card Games",
    description:
      "From TCGs to deck-builders, find your next favorite card game.",
    backgroundImage: "/images/cat-cardgames.jpg",
  },
  {
    slug: "supplies",
    name: "Supplies",
    description:
      "Paints, brushes, dice, and everything you need for your hobby.",
    backgroundImage: "/images/cat-paints.jpg",
  },
];

export const PRODUCTS: Product[] = [
  // Board Games
  {
    slug: "catan",
    title: "Catan",
    category: "Strategy",
    price: 39.99,
    image: "/games/catan.png",
    gradient: "from-emerald-700 to-teal-900",
  },
  {
    slug: "ticket-to-ride",
    title: "Ticket to Ride",
    category: "Family",
    price: 44.99,
    image: "/games/ticket-to-ride.png",
    gradient: "from-blue-600 to-indigo-800",
  },
  {
    slug: "pandemic",
    title: "Pandemic",
    category: "Cooperative",
    price: 34.99,
    image: "/games/pandemic.png",
    gradient: "from-green-600 to-emerald-800",
  },
  {
    slug: "azul",
    title: "Azul",
    category: "Abstract",
    price: 29.99,
    image: "/games/azul.png",
    gradient: "from-cyan-600 to-blue-800",
  },
  {
    slug: "wingspan",
    title: "Wingspan",
    category: "Strategy",
    price: 54.99,
    image: "/games/wingspan.png",
    gradient: "from-amber-600 to-orange-800",
  },
  {
    slug: "root",
    title: "Root",
    category: "Strategy",
    price: 59.99,
    image: "/games/root.png",
    gradient: "from-red-600 to-rose-800",
  },
  {
    slug: "scythe",
    title: "Scythe",
    category: "Strategy",
    price: 69.99,
    image: "/games/scythe.png",
    gradient: "from-slate-600 to-zinc-800",
  },
  {
    slug: "terraforming-mars",
    title: "Terraforming Mars",
    category: "Strategy",
    price: 49.99,
    image: "/games/terraforming-mars.png",
    gradient: "from-orange-600 to-red-800",
  },
  {
    slug: "7-wonders",
    title: "7 Wonders",
    category: "Drafting",
    price: 39.99,
    image: "/games/7-wonders.png",
    gradient: "from-yellow-600 to-amber-800",
  },
  {
    slug: "everdell",
    title: "Everdell",
    category: "Family",
    price: 49.99,
    image: "/games/everdell.png",
    gradient: "from-lime-600 to-green-800",
  },
  {
    slug: "spirit-island",
    title: "Spirit Island",
    category: "Cooperative",
    price: 59.99,
    image: "/games/spirit-island.png",
    gradient: "from-teal-600 to-cyan-800",
  },
  {
    slug: "splendor",
    title: "Splendor",
    category: "Family",
    price: 29.99,
    image: "/games/splendor.png",
    gradient: "from-purple-600 to-violet-800",
  },

  // Miniatures
  {
    slug: "leviathan-starter-set",
    title: "Leviathan Starter Set",
    category: "Warhammer 40K",
    price: 210.0,
    image: "/games/leviathan.png",
    gradient: "from-slate-700 to-slate-900",
  },
  {
    slug: "kill-team-hivestorm",
    title: "Kill Team: Hivestorm",
    category: "Warhammer 40K",
    price: 160.0,
    image: "/games/hivestorm.png",
    gradient: "from-emerald-700 to-emerald-900",
  },
  {
    slug: "legions-imperialis",
    title: "Legions Imperialis: Core Set",
    category: "Warhammer",
    price: 185.0,
    gradient: "from-zinc-600 to-neutral-900",
  },

  // Card Games
  {
    slug: "mtg-foundations-starter",
    title: "MTG Foundations Starter",
    category: "Collectible Card Game",
    price: 59.99,
    image: "/games/foundations.png",
    gradient: "from-amber-600 to-red-800",
  },
  {
    slug: "pokemon-151-etb",
    title: "Pokémon 151 Elite Trainer",
    category: "Collectible Card Game",
    price: 49.99,
    image: "/games/pokemon.jpg",
    gradient: "from-blue-600 to-indigo-800",
  },
  {
    slug: "shadow-realm",
    title: "Shadow Realm Deck",
    category: "Collectible Card Game",
    price: 24.99,
    image: "/games/shadow-realm.jpg",
    gradient: "from-violet-600 to-purple-900",
  },
];

export function getProductsByCategory(categorySlug: string): Product[] {
  const category = CATEGORIES.find((c) => c.slug === categorySlug);
  if (!category) return [];

  // Match products to categories via a mapping
  const categoryMap: Record<string, string[]> = {
    "board-games": PRODUCTS.slice(0, 12).map((p) => p.slug),
    miniatures: PRODUCTS.slice(12, 15).map((p) => p.slug),
    "card-games": PRODUCTS.slice(15, 18).map((p) => p.slug),
    supplies: [],
  };

  const slugs = categoryMap[categorySlug] || [];
  return PRODUCTS.filter((p) => slugs.includes(p.slug));
}

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
