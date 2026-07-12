import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";

interface GameCardProps {
  title: string;
  category: string;
  price: number;
  players: string;
  image?: string;
  gradient?: string;
}

export function GameCard({
  title,
  category,
  price = 185.0,
  players,
  image,
  gradient = "from-zeeks-purple to-zeeks-purple-dark",
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
          {/* Category badge */}
          <span className="text-xs font-semibold uppercase tracking-wide text-status-sale">
            {category}
          </span>
          {/* Title as clickable link */}
          <Link href="#" className="text-lg">
            {title}
          </Link>
          {/* Price */}
          <span className="font-heading text-[22px] font-bold text-text-price">
            ${price.toFixed(2)}
          </span>
        </div>

        {/* Players */}
        <span className="text-sm text-text-muted">{players} players</span>

        {/* Add to Cart button */}
        <Button variant="primary" size="lg" className="w-full">
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
