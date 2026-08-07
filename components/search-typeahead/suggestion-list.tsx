"use client";

import Link from "next/link";
import {
  SuggestionRow,
  type SuggestionData,
} from "@/components/search-typeahead/suggestion-row";

interface SuggestionListProps {
  query: string;
  totalCount: number;
  suggestions: SuggestionData[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onPointerMove: (index: number) => void;
  onViewAll: () => void;
}

export function SuggestionList({
  query,
  totalCount,
  suggestions,
  activeIndex,
  onSelect,
  onPointerMove,
  onViewAll,
}: SuggestionListProps) {
  return (
    <div
      id="search-typeahead-listbox"
      role="listbox"
      aria-label="Product suggestions"
      className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[12px] bg-white shadow-[0_10px_24px_-4px_rgba(14,14,44,0.08)]"
    >
      {/* Results header */}
      <div className="flex items-center gap-2 px-4 pb-3 pt-4">
        <span className="text-sm font-bold uppercase tracking-wide text-text-primary">
          Products
        </span>
        <span className="text-sm text-text-muted">({totalCount} results)</span>
      </div>

      {/* Suggestion rows (up to 5) */}
      <div className="flex flex-col">
        {suggestions.map((suggestion, index) => (
          <SuggestionRow
            key={suggestion.id}
            suggestion={suggestion}
            active={index === activeIndex}
            onSelect={() => onSelect(index)}
            onPointerMove={() => onPointerMove(index)}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-border-subtle" />

      {/* Footer: view all */}
      <Link
        href={`/search?q=${encodeURIComponent(query)}`}
        role="option"
        aria-selected={activeIndex === suggestions.length}
        onClick={onViewAll}
        className="block px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-action-secondary hover:text-action-secondary-hover"
      >
        View all {totalCount} results for &quot;{query}&quot; →
      </Link>
    </div>
  );
}