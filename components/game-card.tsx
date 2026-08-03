import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { AddToCartForm } from "@/components/cart/add-to-cart-form";

interface GameCardProps {
  title: string;
  category: string;
  categorySlug?: string;
  productSlug?: string;
  price: number;
  minPrice?: number;
  maxPrice?: number;
  image?: string;
  gradient?: string;
  catalogObjectId?: string;
  variationId?: string;
  hasVariations?: boolean;
}

export function GameCard({
  title,
  category,
  categorySlug,
  productSlug,
  price = 185.0,
  minPrice,
  maxPrice,
  image,
  gradient = "from-zeeks-purple to-zeeks-purple-dark",
  catalogObjectId,
  variationId,
  hasVariations = false,
}: GameCardProps) {
  return (
    <div className="group flex w-full sm:max-w-[302px] flex-col overflow-hidden rounded-2xl bg-surface-primary shadow-[0_10px_28px_rgba(93,95,239,0.08)]">
      {/* Image area */}
      <div className="relative h-[240px] w-full overflow-hidden bg-neutral-200">
        {image ? (
          <img
            src={image}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-5xl font-bold text-white/30">{title[0]}</div>
            </div>
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="flex flex-col gap-4 p-5">
        {/* Category + title + price — as in Figma text-meta group */}
        <div className="flex flex-col gap-1">
          {/* Category badge — now a clickable link */}
          {categorySlug ? (
            <NextLink
              href={`/categories/${categorySlug}`}
              className="text-xs font-semibold uppercase tracking-wide text-status-sale transition-colors hover:text-status-sale/70"
            >
              {category}
            </NextLink>
          ) : (
            <span className="text-xs font-semibold uppercase tracking-wide text-status-sale">
              {category}
            </span>
          )}
          {/* Title as clickable link */}
          <Link href={productSlug ? `/products/${productSlug}` : "#"} className="text-lg">
            {title}
          </Link>
          {/* Price */}
          <span className="font-heading text-[22px] font-bold text-text-price">
            {hasVariations && minPrice != null && maxPrice != null
              ? `$${minPrice.toFixed(2)} – $${maxPrice.toFixed(2)}`
              : `$${price.toFixed(2)}`}
          </span>
        </div>

        {/* Add to Cart button */}
        {hasVariations ? (
          <NextLink href={productSlug ? `/products/${productSlug}` : "#"}>
            <Button variant="secondary" size="lg" className="w-full">
              Choose Options
            </Button>
          </NextLink>
        ) : catalogObjectId ? (
          <AddToCartForm
            catalogObjectId={variationId || catalogObjectId}
            variationId=""
            quantity={1}
            className="w-full"
            size="lg"
          />
        ) : (
          <Button variant="primary" size="lg" className="w-full">
            Add to Cart
          </Button>
        )}
      </div>
    </div>
  );
}
