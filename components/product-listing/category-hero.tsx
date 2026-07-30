import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface CategoryHeroProps {
  categoryName: string;
  description: string;
  backgroundImage?: string;
}

export function CategoryHero({
  categoryName,
  description,
  backgroundImage,
}: CategoryHeroProps) {
  return (
    <section className="relative flex h-[240px] w-full items-center overflow-hidden bg-neutral-900">
      {/* Background image overlay */}
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
          style={{ backgroundImage: `url('${backgroundImage}')` }}
        />
      )}
      <div className="absolute inset-0 bg-neutral-900/60" />

      {/* Content */}
      <div className="relative z-10 flex w-full flex-col items-center gap-3 px-5 py-10 lg:px-20">
        {/* Breadcrumbs */}
        <nav
          className="flex items-center gap-2"
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            className="text-[13px] font-medium text-white/60 transition-colors hover:text-white"
          >
            Home
          </Link>
          <ChevronRight className="h-2.5 w-2.5 text-white/40" />
          <Link
            href="/shop"
            className="text-[13px] font-medium text-white/60 transition-colors hover:text-white"
          >
            Shop
          </Link>
          <ChevronRight className="h-2.5 w-2.5 text-white/40" />
          <span className="text-[13px] font-semibold text-status-sale">
            {categoryName}
          </span>
        </nav>

        {/* Headline */}
        <h1 className="font-heading text-[32px] italic leading-tight text-status-sale md:text-[44px]">
          {categoryName}
        </h1>

        {/* Subtitle */}
        <p className="max-w-xl text-center text-[15px] leading-relaxed text-white/80">
          {description}
        </p>
      </div>
    </section>
  );
}
