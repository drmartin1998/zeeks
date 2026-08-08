"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FacetGroup, type FacetOptionValue } from "@/components/product-listing/facet-group";
import { SubcategoryFacet } from "@/components/product-listing/subcategory-facet";
import { CategoryChips } from "@/components/product-listing/category-chips";
import { FilterToggle } from "@/components/product-listing/filter-toggle";
import type { CategoryTreeNode } from "@/lib/square/catalog";

type Availability = "IN_STOCK" | "OUT_OF_STOCK";

interface FilterBarProps {
  totalResults: number;
  showingStart: number;
  showingEnd: number;
  activeCount: number;
  currentSort: string;
  onSortChange: (sort: string) => void;
  activeSubs: string[];
  activeBrands: string[];
  activeAvailability: Availability[];
  subOptions: FacetOptionValue[];
  /** Hierarchical subcategory tree for drill-down facet reveal (optional). */
  subNodes?: CategoryTreeNode[];
  /**
   * Slugs of subcategory nodes whose children should be revealed (drill-down
   * expansion), distinct from the single-select filter (`activeSubs`). Threaded
   * to `SubcategoryFacet` so a selected child keeps its ancestors' children
   * visible. Optional; `SubcategoryFacet` falls back to `activeSubs`.
   */
  expandedSubs?: string[];
  /** Product count per subcategory slug (optional, for hierarchical facet). */
  subCounts?: Record<string, number>;
  brandOptions: FacetOptionValue[];
  availabilityOptions: FacetOptionValue[];
  onToggleSub: (slug: string) => void;
  onToggleBrand: (brand: string) => void;
  onToggleAvailability: (value: Availability) => void;
  onClearAll: () => void;
  /** The product results column (grid + pagination) rendered beside/under the facets. */
  children?: ReactNode;
  /** Disable facet interactions while filters are applying. */
  disabled?: boolean;
}

const SORT_OPTIONS = ["Featured", "Price: Low to High", "Price: High to Low", "Newest", "Best Selling"];

export function FilterBar({
  totalResults,
  showingStart,
  showingEnd,
  activeCount,
  currentSort,
  onSortChange,
  activeSubs,
  activeBrands,
  activeAvailability,
  subOptions,
  subNodes,
  expandedSubs,
  subCounts,
  brandOptions,
  availabilityOptions,
  onToggleSub,
  onToggleBrand,
  onToggleAvailability,
  onClearAll,
  children,
  disabled = false,
}: FilterBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasActive = activeCount > 0;

  // Categories facet: use the hierarchical tree when available (drill-down),
  // otherwise fall back to a flat FacetGroup for backward compatibility.
  const categoriesFacet = subNodes && subNodes.length > 0 ? (
    <SubcategoryFacet
      nodes={subNodes}
      selectedSlugs={activeSubs}
      expandedSlugs={expandedSubs}
      countBySlug={subCounts ?? {}}
      onToggle={onToggleSub}
      disabled={disabled}
    />
  ) : (
    <FacetGroup
      title="Categories"
      headerClassName="text-[18px] font-extrabold"
      options={subOptions}
      selectedValues={activeSubs}
      onToggle={onToggleSub}
      disabled={disabled}
    />
  );

  // Grouped facet column shared by the lg sidebar and the sm drawer. The
  // divider lines separate each facet group (design: 1px dividers between
  // groups). Order: Categories → Brand → Availability (NO Price Range).
  const facetGroups = (
    <div className="flex flex-col divide-y divide-border-default">
      <div className="px-4 py-5">{categoriesFacet}</div>
      <div className="px-4 py-5">
        <FacetGroup
          title="Brand"
          options={brandOptions}
          selectedValues={activeBrands}
          onToggle={onToggleBrand}
          disabled={disabled}
        />
      </div>
      <div className="px-4 py-5">
        <FacetGroup
          title="Availability"
          options={availabilityOptions}
          selectedValues={activeAvailability}
          onToggle={(v) => onToggleAvailability(v as Availability)}
          disabled={disabled}
        />
      </div>
      {hasActive && (
        <div className="px-4 py-5">
          <button
            type="button"
            onClick={onClearAll}
            disabled={disabled}
            className="self-start text-[13px] font-semibold text-zeeks-purple underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            Clear all ({activeCount})
          </button>
        </div>
      )}
    </div>
  );

  // Medium (md) horizontal strip — Categories as chip pills + a labeled
  // filter row with Brand and Availability as two equal columns.
  const chipOptions = subOptions.map((o) => ({
    slug: o.value,
    name: o.label,
    count: o.count,
  }));

  const mediumStrip = (
    <div className="flex flex-col gap-6">
      <CategoryChips
        title="Games Workshop Categories"
        options={chipOptions}
        selectedValues={activeSubs}
        onToggle={onToggleSub}
        disabled={disabled}
      />
      <div className="grid grid-cols-2 gap-6">
        <FacetGroup
          title="Brand"
          options={brandOptions}
          selectedValues={activeBrands}
          onToggle={onToggleBrand}
          disabled={disabled}
        />
        <FacetGroup
          title="Availability"
          options={availabilityOptions}
          selectedValues={activeAvailability}
          onToggle={(v) => onToggleAvailability(v as Availability)}
          disabled={disabled}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-surface-primary">
      <div className="mx-auto max-w-[1440px] px-4 py-4 md:px-8 lg:px-20">
        {/* Results bar: count + sort */}
        <div className="flex items-center justify-between gap-6">
          <span className="text-sm text-text-primary">
            Showing {showingStart}–{showingEnd} of {totalResults} results
          </span>
          <div className="relative">
            <select
              value={currentSort}
              disabled={disabled}
              onChange={(e) => onSortChange(e.target.value)}
              className={cn(
                "inline-flex h-[35px] cursor-pointer appearance-none items-center gap-3 rounded-md border-0 bg-white pl-4 pr-10 text-[13px] font-semibold text-text-primary transition-colors hover:bg-surface-secondary focus:outline-none",
                disabled && "cursor-not-allowed opacity-60"
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

        {/* Mobile (sm): filter toggle + collapsible facets (no price range) */}
        <div className="mt-4 md:hidden">
          <FilterToggle
            activeCount={activeCount}
            open={mobileOpen}
            onToggle={() => setMobileOpen((o) => !o)}
          />
          {mobileOpen && (
            <div className="mt-4 rounded-lg border border-border-default bg-surface-secondary">
              {facetGroups}
            </div>
          )}
        </div>

        {/* Medium (md): horizontal strip with category chips + brand/availability (above the grid) */}
        <div className="mt-4 hidden md:block lg:hidden">
          {mediumStrip}
        </div>

        {/* Large (lg): left sidebar (280px) + product grid in a single horizontal row.
            On sm/md the sidebar is hidden and only the products column shows. */}
        <div className="mt-6 flex flex-col gap-10 lg:flex-row">
          <aside className="hidden w-[280px] shrink-0 self-start rounded-lg border border-border-default bg-surface-secondary lg:block">
            {facetGroups}
          </aside>
          <div className="min-w-0 flex-1 pb-6">{children}</div>
        </div>
      </div>
    </div>
  );
}