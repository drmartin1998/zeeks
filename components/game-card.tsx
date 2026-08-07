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
    <div className="group flex w-[280px] flex-col overflow-hidden rounded-[12px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      {/* Image area — locked 4:3 (280×210), object-fit cover */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-200">
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

      {/* Content */}
      <div className="flex flex-col gap-1 px-4 pb-4 pt-3">
        {/* Category tag — 11px, uppercase, brand orange #E8950E */}
        {categorySlug ? (
          <NextLink
            href={`/categories/${categorySlug}`}
            className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#E8950E] transition-colors hover:text-[#C47F10]"
          >
            {category}
          </NextLink>
        ) : (
          <span className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#E8950E]">
            {category}
          </span>
        )}

        {/* Title — 16px, 600, dark navy #1A1A2E */}
        <Link
          href={productSlug ? `/products/${productSlug}` : "#"}
          className="text-base font-semibold leading-snug text-[#1A1A2E]"
        >
          {title}
        </Link>

        {/* Price — 18px, bold, dark navy #1A1A2E */}
        <span className="text-[18px] font-bold text-[#1A1A2E]">
          {hasVariations && minPrice != null && maxPrice != null
            ? `$${minPrice.toFixed(2)} – $${maxPrice.toFixed(2)}`
            : `$${price.toFixed(2)}`}
        </span>

        {/* CTA — full width, orange bg #E8950E, white text */}
        <div className="mt-2">
          {hasVariations ? (
            <NextLink href={productSlug ? `/products/${productSlug}` : "#"}>
              <Button
                variant="default"
                size="lg"
                className="w-full !bg-[#E8950E] hover:!bg-[#C47F10]"
              >
                Choose Options
              </Button>
            </NextLink>
          ) : catalogObjectId ? (
            <AddToCartForm
              catalogObjectId={variationId || catalogObjectId}
              variationId=""
              quantity={1}
              className="w-full !bg-[#E8950E] hover:!bg-[#C47F10]"
              size="lg"
            />
          ) : (
            <Button
              variant="default"
              size="lg"
              className="w-full !bg-[#E8950E] hover:!bg-[#C47F10]"
            >
              Add to Cart
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}