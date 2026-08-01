import { CategoryCard } from "@/components/category-card";

interface FeaturedCategoriesProps {
  categories: { title: string; image: string; href: string }[];
}

export function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
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
            The world&apos;s biggest gaming universes, all in one place.
          </p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {categories.map((cat) => (
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
