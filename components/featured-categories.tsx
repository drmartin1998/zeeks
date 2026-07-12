import { CategoryCard } from "@/components/category-card";

const CATEGORIES = [
  { title: "Warhammer 40K", image: "/category-cards/warhammer-category-card.png", href: "#" },
  { title: "Collectible Card Games", image: "/category-cards/magic-category-card.png", href: "#" },
  { title: "Roleplaying Games", image: "/category-cards/rpg-category-card.png", href: "#" },
  { title: "Paints & Tools", image: "/category-cards/paint-category-card.png", href: "#" },
];

export function FeaturedCategories() {
  return (
    <section className="w-full" style={{ backgroundColor: "#F5F3FF" }}>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 py-12 md:gap-10 md:px-8 lg:px-20 lg:py-16">
        {/* Section header */}
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-[40px] font-extrabold leading-tight">
            <span style={{ color: "#7B4FA2" }}>Popular</span>{" "}
            <span style={{ color: "#5D5FEF" }}> </span>
            <span style={{ color: "#0E0E2C" }}>Categories</span>
          </h2>
          <p style={{ color: "#E89516" }}>
            The world's biggest gaming universes, all in one place.
          </p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.title}
              title={cat.title}
              image={cat.image}
              href={cat.href}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
