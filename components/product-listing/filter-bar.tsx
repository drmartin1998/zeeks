"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";

interface FilterBarProps {
  totalResults: number;
  showingStart: number;
  showingEnd: number;
  activeFilters: string[];
  currentSort: string;
  onFilterToggle: (filter: string) => void;
  onSortChange: (sort: string) => void;
  /** When provided, used to populate the "Category" dropdown options */
  subCategories?: { slug: string; name: string }[];
}

const SORT_OPTIONS = ["Featured", "Price: Low to High", "Price: High to Low", "Newest", "Best Selling"];

const PRICE_RANGE_OPTIONS = [
  { value: "all", label: "All Prices" },
  { value: "under-25", label: "Under $25" },
  { value: "25-50", label: "$25 - $50" },
  { value: "50-100", label: "$50 - $100" },
  { value: "over-100", label: "Over $100" },
];



export function FilterBar({
  totalResults,
  showingStart,
  showingEnd,
  activeFilters,
  currentSort,
  onFilterToggle,
  onSortChange,
  subCategories,
}: FilterBarProps) {
  // Build category dropdown options from subcategories
  const categoryOptions = subCategories && subCategories.length > 0
    ? [
        { value: "__all__", label: "All Categories" },
        ...subCategories.map((sub) => ({
          value: sub.slug,
          label: sub.name,
        })),
      ]
    : [{ value: "__all__", label: "All Categories" }];

  // Determine active category filter
  const activeCategory = activeFilters.length > 0
    ? activeFilters[0]
    : "__all__";

  return (
    <div className="bg-surface-secondary">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 md:px-8 lg:px-20">
        {/* Top row: Filters + Sort */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Filters group — dropdowns matching Figma design */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase text-action-secondary">
              Filters:
            </span>
            <Dropdown
              label="Category"
              options={categoryOptions}
              value={activeCategory}
              onChange={(val) => onFilterToggle(val)}
            />
            <Dropdown
              label="Price Range"
              options={PRICE_RANGE_OPTIONS}
              placeholder="Price Range"
              onChange={(val) => onFilterToggle(val)}
            />
          </div>

          {/* Sort group */}
          <div className="flex items-center gap-6">
            <span className="text-sm text-text-primary">
              Showing {showingStart}–{showingEnd} of {totalResults} results
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
      </div>
    </div>
  );
}
