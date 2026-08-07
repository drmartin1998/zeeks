"use client";

import Link from "next/link";

export interface SuggestionData {
  /** Catalog product ID (stable React key). */
  id: string;
  /** Product display name. */
  title: string;
  /** Derived URL-safe slug for the product detail link. */
  slug: string;
  /** Price in dollars. */
  price: number;
  /** Optional image URL. */
  image?: string | null;
}

interface SuggestionRowProps {
  suggestion: SuggestionData;
  active: boolean;
  onSelect: () => void;
  onPointerMove: () => void;
}

export function SuggestionRow({
  suggestion,
  active,
  onSelect,
  onPointerMove,
}: SuggestionRowProps) {
  return (
    <Link
      href={`/products/${suggestion.slug}`}
      role="option"
      aria-selected={active}
      id={`search-typeahead-option-${suggestion.id}`}
      onMouseEnter={onPointerMove}
      onClick={onSelect}
      className={
        active
          ? "flex items-center gap-3 bg-surface-secondary px-4 py-2.5"
          : "flex items-center gap-3 px-4 py-2.5"
      }
    >
      {/* Thumbnail or gradient placeholder */}
      {suggestion.image ? (
        <img
          src={suggestion.image}
          alt=""
          className="h-10 w-10 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zeeks-purple/10 text-base font-bold text-zeeks-purple">
          {suggestion.title[0]}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-text-primary">
          {suggestion.title}
        </span>
        <span className="text-xs text-text-muted">
          ${suggestion.price.toFixed(2)}
        </span>
      </div>
    </Link>
  );
}