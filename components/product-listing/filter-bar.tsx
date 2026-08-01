"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  totalResults: number;
  showingCount: number;
  activeFilters: string[];
  currentSort: string;
  onFilterToggle: (filter: string) => void;
  onSortChange: (sort: string) => void;
  /** When provided, renders subcategory filter chips instead of the default hardcoded options */
  subCategories?: { slug: string; name: string }[];
}

const FILTER_OPTIONS = ["Category", "Price Range", "Player Count", "Age Range"];
const SORT_OPTIONS = ["Featured", "Price: Low to High", "Price: High to Low", "Newest", "Best Selling"];

export function FilterBar({
  totalResults,
  showingCount,
  activeFilters,
  currentSort,
  onFilterToggle,
  onSortChange,
  subCategories,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 bg-surface-secondary px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-20">
      {/* Filters group */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold uppercase text-action-secondary">
          Filters:
        </span>
        {subCategories && subCategories.length > 0 ? (
          <>
            <button
              onClick={() => onFilterToggle("__all__")}
              className={cn(
                "inline-flex h-[35px] items-center rounded-md px-4 text-[13px] font-semibold transition-colors",
                activeFilters.length === 0
                  ? "bg-action-secondary text-white"
                  : "bg-white text-text-primary hover:bg-surface-secondary"
              )}
            >
              All
            </button>
            {subCategories.map((sub) => {
              const isActive = activeFilters.includes(sub.slug);
              return (
                <button
                  key={sub.slug}
                  onClick={() => onFilterToggle(sub.slug)}
                  className={cn(
                    "inline-flex h-[35px] items-center rounded-md px-4 text-[13px] font-semibold transition-colors",
                    isActive
                      ? "bg-action-secondary text-white"
                      : "bg-white text-text-primary hover:bg-surface-secondary"
                  )}
                >
                  {sub.name}
                </button>
              );
            })}
          </>
        ) : (
          FILTER_OPTIONS.map((filter) => {
            const isActive = activeFilters.includes(filter);
            return (
              <button
                key={filter}
                onClick={() => onFilterToggle(filter)}
                className={cn(
                  "inline-flex h-[35px] items-center gap-3 rounded-md px-4 text-[13px] font-semibold transition-colors",
                  isActive
                    ? "bg-action-secondary text-white"
                    : "bg-white text-text-primary hover:bg-surface-secondary"
                )}
              >
                {filter}
                <ChevronDown className="h-3 w-3" />
              </button>
            );
          })
        )}
      </div>

      {/* Sort group */}
      <div className="flex items-center gap-6">
        <span className="text-sm text-text-primary">
          Showing {showingCount} of {totalResults} results
        </span>
        <div className="relative">
          <select
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value)}
            className={cn(
              "inline-flex h-[35px] cursor-pointer appearance-none items-center gap-3 rounded-md border-0 bg-white pl-4 pr-10 text-[13px] font-semibold text-text-primary transition-colors hover:bg-surface-secondary focus:outline-none"
            )}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                Sort by: {option}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-text-muted" />
        </div>
      </div>
    </div>
  );
}
