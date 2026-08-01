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
    title: "Warhammer 40K",
    slug: "warhammer-40k",
    image: "/category-cards/warhammer-category-card.png",
    href: "/categories/warhammer-40k",
  },
  {
    title: "Collectible Card Games",
    slug: "card-games",
    image: "/category-cards/magic-category-card.png",
    href: "/categories/card-games",
  },
  {
    title: "Roleplaying Games",
    slug: "rpgs",
    image: "/category-cards/rpg-category-card.png",
    href: "/categories/rpgs",
  },
  {
    title: "Paints & Tools",
    slug: "paints-tools",
    image: "/category-cards/paint-category-card.png",
    href: "/categories/paints-tools",
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
    categorySlug: "warhammer-40k",
    price: 210.0,
    image: "/games/leviathan.png",
    gradient: "from-slate-700 to-slate-900",
  },
  {
    title: "Kill Team: Hivestorm",
    category: "Warhammer 40K",
    categorySlug: "warhammer-40k",
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

/** Look up a category by its slug */
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

/** Get all products that belong to a given category slug */
export function getProductsByCategorySlug(slug: string): Product[] {
  return FEATURED_GAMES.filter((p) => p.categorySlug === slug);
}
