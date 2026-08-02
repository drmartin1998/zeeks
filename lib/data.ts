/**
 * Hardcoded mock product and category data.
 *
 * @deprecated This entire module is deprecated. Use the Square SDK-backed
 *   Route Handlers instead:
 *   - Categories: `fetch("/api/catalog/categories")`
 *   - Products:   `fetch("/api/catalog/products?slug={slug}")`
 *
 *   This module is kept for backward compatibility with test files only.
 *   Production code MUST NOT import from this module (enforced by ESLint).
 */
export interface Category {
  title: string;
  slug: string;
  image: string;
  href: string;
}

export interface Product {
  title: string;
  category: string;
  categorySlug: string;
  price: number;
  image: string;
  gradient: string;
}

export const CATEGORIES: Category[] = [
  {
    title: "Board Games",
    slug: "board-games",
    image: "/category-cards/rpg-category-card.png",
    href: "/categories/board-games",
  },
  {
    title: "Miniatures",
    slug: "miniatures",
    image: "/category-cards/warhammer-category-card.png",
    href: "/categories/miniatures",
  },
  {
    title: "Card Games",
    slug: "card-games",
    image: "/category-cards/magic-category-card.png",
    href: "/categories/card-games",
  },
  {
    title: "Supplies",
    slug: "supplies",
    image: "/category-cards/paint-category-card.png",
    href: "/categories/supplies",
  },
  {
    title: "Sale",
    slug: "sale",
    image: "/category-cards/paint-category-card.png",
    href: "/categories/sale",
  },
  {
    title: "New Arrivals",
    slug: "new-arrivals",
    image: "/category-cards/warhammer-category-card.png",
    href: "/categories/new-arrivals",
  },
];

/**
 * Hardcoded navigation categories.
 *
 * @deprecated Use {@link getNavCategories} from `@/lib/data/categories` instead.
 *   That function pulls categories from the Square Catalog API and appends
 *   "About Us", "Locations", and "Sale". This export is kept as a fallback.
 */
export const NAV_CATEGORIES = [
  { label: "Miniatures", href: "/categories/miniatures" },
  { label: "Board Games", href: "/categories/board-games" },
  { label: "Card Games", href: "/categories/card-games" },
  { label: "Supplies", href: "/categories/supplies" },
  { label: "About Us", href: "/about" },
  { label: "Locations", href: "/locations" },
  { label: "Sale", href: "/categories/sale", highlight: true },
];

export const FEATURED_GAMES: Product[] = [
  {
    title: "Leviathan Starter Set",
    category: "Warhammer 40K",
    categorySlug: "miniatures",
    price: 210.0,
    image: "/games/leviathan.png",
    gradient: "from-slate-700 to-slate-900",
  },
  {
    title: "Kill Team: Hivestorm",
    category: "Warhammer 40K",
    categorySlug: "miniatures",
    price: 160.0,
    image: "/games/hivestorm.png",
    gradient: "from-emerald-700 to-emerald-900",
  },
  {
    title: "MTG Foundations Starter",
    category: "Collectible Card Game",
    categorySlug: "card-games",
    price: 59.99,
    image: "/games/foundations.png",
    gradient: "from-amber-600 to-red-800",
  },
  {
    title: "Pokémon 151 Elite Trainer",
    category: "Collectible Card Game",
    categorySlug: "card-games",
    price: 49.99,
    image: "/games/pokemon.jpg",
    gradient: "from-blue-600 to-indigo-800",
  },
];

/** All products across every category. Used by category listing pages. */
export const ALL_PRODUCTS: Product[] = [
  // Board Games
  {
    title: "Catan",
    category: "Strategy",
    categorySlug: "board-games",
    price: 39.99,
    image: "/games/catan.png",
    gradient: "from-emerald-700 to-teal-900",
  },
  {
    title: "Ticket to Ride",
    category: "Family",
    categorySlug: "board-games",
    price: 44.99,
    image: "/games/ticket-to-ride.png",
    gradient: "from-blue-600 to-indigo-800",
  },
  {
    title: "Pandemic",
    category: "Cooperative",
    categorySlug: "board-games",
    price: 34.99,
    image: "/games/pandemic.png",
    gradient: "from-green-600 to-emerald-800",
  },
  {
    title: "Azul",
    category: "Abstract",
    categorySlug: "board-games",
    price: 29.99,
    image: "/games/azul.png",
    gradient: "from-cyan-600 to-blue-800",
  },
  {
    title: "Wingspan",
    category: "Strategy",
    categorySlug: "board-games",
    price: 54.99,
    image: "/games/wingspan.png",
    gradient: "from-amber-600 to-orange-800",
  },
  {
    title: "Root",
    category: "Strategy",
    categorySlug: "board-games",
    price: 59.99,
    image: "/games/root.png",
    gradient: "from-red-600 to-rose-800",
  },
  {
    title: "Scythe",
    category: "Strategy",
    categorySlug: "board-games",
    price: 69.99,
    image: "/games/scythe.png",
    gradient: "from-slate-600 to-zinc-800",
  },
  {
    title: "Terraforming Mars",
    category: "Strategy",
    categorySlug: "board-games",
    price: 49.99,
    image: "/games/terraforming-mars.png",
    gradient: "from-orange-600 to-red-800",
  },
  {
    title: "7 Wonders",
    category: "Drafting",
    categorySlug: "board-games",
    price: 39.99,
    image: "/games/7-wonders.png",
    gradient: "from-yellow-600 to-amber-800",
  },
  {
    title: "Everdell",
    category: "Family",
    categorySlug: "board-games",
    price: 49.99,
    image: "/games/everdell.png",
    gradient: "from-lime-600 to-green-800",
  },
  {
    title: "Spirit Island",
    category: "Cooperative",
    categorySlug: "board-games",
    price: 59.99,
    image: "/games/spirit-island.png",
    gradient: "from-teal-600 to-cyan-800",
  },
  {
    title: "Splendor",
    category: "Family",
    categorySlug: "board-games",
    price: 29.99,
    image: "/games/splendor.png",
    gradient: "from-purple-600 to-violet-800",
  },
  // Miniatures
  {
    title: "Leviathan Starter Set",
    category: "Warhammer 40K",
    categorySlug: "miniatures",
    price: 210.0,
    image: "/games/leviathan.png",
    gradient: "from-slate-700 to-slate-900",
  },
  {
    title: "Kill Team: Hivestorm",
    category: "Warhammer 40K",
    categorySlug: "miniatures",
    price: 160.0,
    image: "/games/hivestorm.png",
    gradient: "from-emerald-700 to-emerald-900",
  },
  {
    title: "Legions Imperialis: Core Set",
    category: "Warhammer",
    categorySlug: "miniatures",
    price: 185.0,
    image: "",
    gradient: "from-zinc-600 to-neutral-900",
  },
  // Card Games
  {
    title: "MTG Foundations Starter",
    category: "Collectible Card Game",
    categorySlug: "card-games",
    price: 59.99,
    image: "/games/foundations.png",
    gradient: "from-amber-600 to-red-800",
  },
  {
    title: "Pokémon 151 Elite Trainer",
    category: "Collectible Card Game",
    categorySlug: "card-games",
    price: 49.99,
    image: "/games/pokemon.jpg",
    gradient: "from-blue-600 to-indigo-800",
  },
  {
    title: "Shadow Realm Deck",
    category: "Collectible Card Game",
    categorySlug: "card-games",
    price: 24.99,
    image: "/games/shadow-realm.jpg",
    gradient: "from-violet-600 to-purple-900",
  },
  // New Arrivals (featured products on homepage)
  {
    title: "Leviathan Starter Set",
    category: "Warhammer 40K",
    categorySlug: "new-arrivals",
    price: 210.0,
    image: "/games/leviathan.png",
    gradient: "from-slate-700 to-slate-900",
  },
  {
    title: "Kill Team: Hivestorm",
    category: "Warhammer 40K",
    categorySlug: "new-arrivals",
    price: 160.0,
    image: "/games/hivestorm.png",
    gradient: "from-emerald-700 to-emerald-900",
  },
  {
    title: "MTG Foundations Starter",
    category: "Collectible Card Game",
    categorySlug: "new-arrivals",
    price: 59.99,
    image: "/games/foundations.png",
    gradient: "from-amber-600 to-red-800",
  },
  {
    title: "Pokémon 151 Elite Trainer",
    category: "Collectible Card Game",
    categorySlug: "new-arrivals",
    price: 49.99,
    image: "/games/pokemon.jpg",
    gradient: "from-blue-600 to-indigo-800",
  },
  // Sale
  {
    title: "Catan",
    category: "Strategy",
    categorySlug: "sale",
    price: 29.99,
    image: "/games/catan.png",
    gradient: "from-emerald-700 to-teal-900",
  },
  {
    title: "Pandemic",
    category: "Cooperative",
    categorySlug: "sale",
    price: 24.99,
    image: "/games/pandemic.png",
    gradient: "from-green-600 to-emerald-800",
  },
  {
    title: "Splendor",
    category: "Family",
    categorySlug: "sale",
    price: 19.99,
    image: "/games/splendor.png",
    gradient: "from-purple-600 to-violet-800",
  },
];
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

/** Get all products that belong to a given category slug */
export function getProductsByCategorySlug(slug: string): Product[] {
  return ALL_PRODUCTS.filter((p) => p.categorySlug === slug);
}
