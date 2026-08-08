"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Footer } from "@/components/footer";
import { CategoryHero } from "@/components/product-listing/category-hero";
import { FilterBar } from "@/components/product-listing/filter-bar";
import { ProductGrid } from "@/components/product-listing/product-grid";
import { ProductGridSkeleton } from "@/components/product-listing/product-grid-skeleton";
import { Pagination } from "@/components/product-listing/pagination";
import type { CategoryDisplayData as CategoryData } from "@/lib/square/types";
import type { SquareSubCategory, CategoryTreeNode } from "@/lib/square/catalog";

type Availability = "IN_STOCK" | "OUT_OF_STOCK";

interface ListingProduct {
  slug: string;
  title: string;
  category: string;
  subCategory?: string;
  subCategorySlug?: string;
  /** Ordered slug path (top child → deepest) for drill-down filtering. */
  subCategorySlugs?: string[];
  price: number;
  minPrice?: number;
  maxPrice?: number;
  image?: string;
  gradient?: string;
  catalogObjectId?: string;
  variationId?: string;
  hasVariations?: boolean;
  brand?: string;
  availability: Availability;
}

interface ProductListingPageProps {
  category: CategoryData;
  /** Products for this category — always required (fetched from Square). */
  products: ListingProduct[];
  /** Subcategories for filtering (flat, backward compatible) */
  subCategories?: SquareSubCategory[];
  /** Hierarchical subcategory tree for drill-down facet reveal */
  subCategoryTree?: CategoryTreeNode[];
  /**
   * How long (ms) to show skeleton loaders and lock the facets after a facet
   * change, simulating the browser fetch. Set to 0 to disable the loading UX.
   * @default 500
   */
  facetLoadingMs?: number;
}

const ITEMS_PER_PAGE = 12;

/** Build a URL query string from the active facets. */
function buildQueryString(params: {
  subs: string[];
  brands: string[];
  availability: Availability[];
}): string {
  const sp = new URLSearchParams();
  if (params.subs.length > 0) sp.set("sub", params.subs[0]);
  for (const b of params.brands) sp.append("brand", b);
  for (const a of params.availability) sp.append("availability", a);
  const qs = sp.toString();
  return qs ? `?${qs}` : "?";
}

const AVAILABILITY_OPTIONS: { value: Availability; label: string }[] = [
  { value: "IN_STOCK", label: "In Stock" },
  { value: "OUT_OF_STOCK", label: "Out of Stock" },
];

/**
 * Whether a product belongs to a subcategory facet node `slug`.
 *
 * Products annotated with a `subCategorySlugs` path (top child → deepest)
 * match a node iff the node's slug appears in that path — so selecting a
 * parent matches all products under it (parent + descendants), and selecting
 * a child matches only that child's products. Products without the path fall
 * back to a direct `subCategorySlug` equality check for backward compatibility.
 */
function productMatchesSub(p: ListingProduct, slug: string): boolean {
  if (p.subCategorySlugs && p.subCategorySlugs.length > 0) {
    return p.subCategorySlugs.includes(slug);
  }
  return !!p.subCategorySlug && p.subCategorySlug === slug;
}

/** Convert a flat `SquareSubCategory[]` into a leaf-only tree (backward compat). */
function flatTreeFromSubs(subs: SquareSubCategory[]): CategoryTreeNode[] {
  return (subs ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    children: [],
  }));
}

/** Flatten a tree into all node slugs (for default "all visible" behavior). */
function collectAllSlugs(nodes: CategoryTreeNode[]): string[] {
  const slugs: string[] = [];
  const walk = (node: CategoryTreeNode) => {
    slugs.push(node.slug);
    for (const child of node.children) walk(child);
  };
  for (const node of nodes) walk(node);
  return slugs;
}

/**
 * Find the tree node matching a slug, or `undefined` if it is not present.
 */
function findTreeNode(
  nodes: CategoryTreeNode[],
  slug: string
): CategoryTreeNode | undefined {
  for (const node of nodes) {
    if (node.slug === slug) return node;
    const found = findTreeNode(node.children, slug);
    if (found) return found;
  }
  return undefined;
}

/**
 * Return the slug of the parent of the node with the given slug, or `undefined`
 * if the node is a top-level child (no parent within this tree) or not present.
 */
function findParentSlug(
  nodes: CategoryTreeNode[],
  slug: string
): string | undefined {
  for (const node of nodes) {
    if (node.children.some((child) => child.slug === slug)) return node.slug;
    const parent = findParentSlug(node.children, slug);
    if (parent) return parent;
  }
  return undefined;
}

/**
 * Whether a node (or any of its descendants) has a slug present in the
 * selected slugs. Used to determine if a node is visually "checked" so a
 * parent counts as selected when a descendant is selected.
 */
function isSelectedOrDescendant(
  node: CategoryTreeNode,
  selectedSlugs: string[]
): boolean {
  if (selectedSlugs.includes(node.slug)) return true;
  return node.children.some((child) => isSelectedOrDescendant(child, selectedSlugs));
}

/**
 * Compute the set of subcategory slugs whose children should be revealed
 * (the drill-down EXPANDED state), given the currently selected filter nodes.
 *
 * Selection is single-select (a leaf): when a node is in `activeSubs`, every
 * ancestor on the path from a top-level child down to that node is expanded, so
 * a selected child keeps its parent's children visible while drilling deeper.
 */
function collectExpandedSlugs(
  nodes: CategoryTreeNode[],
  selected: string[]
): Set<string> {
  const expanded = new Set<string>();
  const walk = (node: CategoryTreeNode, ancestors: string[]) => {
    if (selected.includes(node.slug)) {
      for (const a of ancestors) expanded.add(a);
      expanded.add(node.slug);
    }
    for (const child of node.children) {
      walk(child, [...ancestors, node.slug]);
    }
  };
  for (const node of nodes) walk(node, []);
  return expanded;
}

export function ProductListingPage({
  category,
  products: allProducts,
  subCategories,
  subCategoryTree,
  facetLoadingMs = 500,
}: ProductListingPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial filters from URL
  const initialSub = searchParams.get("sub");
  const initialBrands = searchParams.getAll("brand");
  const initialAvailability = searchParams.getAll("availability");

  // Resolve the hierarchical subcategory tree. When the server provides a
  // full tree, use it; otherwise fall back to the flat subcategories (leaf-only
  // tree) so backward-compatible consumers keep working.
  const subTree = useMemo(() => {
    if (subCategoryTree && subCategoryTree.length > 0) return subCategoryTree;
    return flatTreeFromSubs(subCategories ?? []);
  }, [subCategoryTree, subCategories]);

  // All subcategory slugs anywhere in the tree (top-level children, their
  // children, grandchildren, ...). Used to validate URL/subcategory filters so
  // a nested subcategory (e.g., "warhammer-old-world" under "Games Workshop")
  // is recognized and preselected even though it is not a direct child.
  const allSubSlugs = useMemo(() => collectAllSlugs(subTree), [subTree]);

  const [activeSubs, setActiveSubs] = useState<string[]>(
    initialSub && allSubSlugs.includes(initialSub) ? [initialSub] : []
  );
  const [activeBrands, setActiveBrands] = useState<string[]>(initialBrands);
  const [activeAvailability, setActiveAvailability] = useState<Availability[]>(
    initialAvailability.filter(
      (a): a is Availability =>
        a === "IN_STOCK" || a === "OUT_OF_STOCK"
    )
  );
  const [currentSort, setCurrentSort] = useState("Featured");
  const [currentPage, setCurrentPage] = useState(1);
  // True while a facet change is applying: results show skeleton loaders and
  // the facets are locked so shoppers cannot race ahead of the browser fetch.
  const [facetLoading, setFacetLoading] = useState(false);
  const facetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tracks the last URL we pushed ourselves so the URL→state sync below only
  // reacts to *external* navigation (back/forward, the Shop megamenu), not to
  // our own filter toggles. This prevents a feedback loop and keeps rapid facet
  // clicks from bouncing the UI to a stale state.
  const lastPushedUrl = useRef<string | null>(null);
  // Debounce timer so many rapid clicks coalesce into a single URL update.
  const urlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep filter state in sync with the URL for external changes (back/forward,
  // the Shop megamenu). Our own toggle handlers update state instantly, so this
  // re-application is idempotent — it only corrects state when navigation came
  // from outside this component.
  const urlSub = searchParams.get("sub");
  const [prevUrlSub, setPrevUrlSub] = useState(urlSub);
  if (urlSub !== prevUrlSub) {
    setPrevUrlSub(urlSub);
    const nextSub = urlSub && allSubSlugs.includes(urlSub) ? [urlSub] : [];
    setActiveSubs(nextSub);
    setActiveBrands(searchParams.getAll("brand"));
    setActiveAvailability(
      searchParams
        .getAll("availability")
        .filter((a): a is Availability => a === "IN_STOCK" || a === "OUT_OF_STOCK")
    );
    setCurrentPage(1);
  }

  // Clean up the debounce timer on unmount.
  useEffect(() => {
    return () => {
      if (urlTimer.current) clearTimeout(urlTimer.current);
      if (facetTimer.current) clearTimeout(facetTimer.current);
    };
  }, []);

  // Products matching the OTHER active facet groups — used to derive the
  // available (non-disabled) options for each facet (dynamic narrowing).
  const subFiltered = useMemo(
    () =>
      activeSubs.length === 0
        ? allProducts
        : allProducts.filter((p) =>
            activeSubs.some((s) => productMatchesSub(p, s))
          ),
    [allProducts, activeSubs]
  );

  // Combined filter: products matching ALL active facet groups.
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      if (
        activeSubs.length > 0 &&
        !activeSubs.some((s) => productMatchesSub(p, s))
      )
        return false;
      if (activeBrands.length > 0 && !(p.brand && activeBrands.includes(p.brand)))
        return false;
      if (
        activeAvailability.length > 0 &&
        !(p.availability && activeAvailability.includes(p.availability))
      )
        return false;
      return true;
    });
  }, [allProducts, activeSubs, activeBrands, activeAvailability]);

  // Facet option counts against the currently filtered set (for dynamic narrowing).
  const facetCounts = useMemo(() => {
    const subCounts = new Map<string, number>();
    const brandCounts = new Map<string, number>();
    const availabilityCounts = new Map<Availability, number>();
    for (const p of filteredProducts) {
      if (p.subCategorySlugs && p.subCategorySlugs.length > 0) {
        // Count the product against every node in its path (top child →
        // deepest), so a parent's count includes all of its descendants and a
        // grandchild's count reflects its own products.
        for (const slug of p.subCategorySlugs) {
          subCounts.set(slug, (subCounts.get(slug) ?? 0) + 1);
        }
      } else if (p.subCategorySlug) {
        subCounts.set(p.subCategorySlug, (subCounts.get(p.subCategorySlug) ?? 0) + 1);
      }
      if (p.brand) {
        brandCounts.set(p.brand, (brandCounts.get(p.brand) ?? 0) + 1);
      }
      if (p.availability) {
        availabilityCounts.set(
          p.availability,
          (availabilityCounts.get(p.availability) ?? 0) + 1
        );
      }
    }
    return { subCounts, brandCounts, availabilityCounts };
  }, [filteredProducts]);

  // Dynamic narrowing: brand options = brands present in the sub+availability filtered set.
  const visibleBrands = useMemo(() => {
    return Array.from(
      new Set(
        subFiltered
          .filter((p) => p.brand && (activeAvailability.length === 0 || (p.availability && activeAvailability.includes(p.availability))))
          .map((p) => p.brand!)
      )
    );
  }, [subFiltered, activeAvailability]);

  // Slugs of subcategory nodes that should reveal their children (drill-down
  // expansion). Separated from the filter selection (`activeSubs`): when a child
  // is selected, its ancestors stay expanded so the parent's children remain
  // visible. Derived from the tree so it is always consistent with `activeSubs`.
  const expandedSubs = useMemo(
    () => Array.from(collectExpandedSlugs(subTree, activeSubs)),
    [subTree, activeSubs]
  );

  // Subcategory options: all subcategories by default. Only narrow when a
  // brand or availability filter is active (a subcategory stays visible if
  // it has products matching those filters). This keeps categories that have
  // products in their descendants (e.g., "Games Workshop") visible even when
  // no product is directly assigned to them.
  const visibleSubs = useMemo(() => {
    if (activeBrands.length === 0 && activeAvailability.length === 0) {
      return collectAllSlugs(subTree);
    }
    return Array.from(
      new Set(
        filteredProducts
          .filter((p) => p.subCategorySlug)
          .map((p) => p.subCategorySlug!)
      )
    );
  }, [subTree, activeBrands, activeAvailability, filteredProducts]);

  // Availability options present in the sub+brand filtered set.
  const visibleAvailability = useMemo(() => {
    const present = new Set<Availability>();
    for (const p of subFiltered) {
      if (
        p.availability &&
        (activeBrands.length === 0 || (p.brand && activeBrands.includes(p.brand)))
      ) {
        present.add(p.availability);
      }
    }
    return present;
  }, [subFiltered, activeBrands]);

  // Apply sorting
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    switch (currentSort) {
      case "Price: Low to High":
        return sorted.sort((a, b) => a.price - b.price);
      case "Price: High to Low":
        return sorted.sort((a, b) => b.price - a.price);
      case "Newest":
      case "Featured":
      default:
        return sorted;
    }
  }, [filteredProducts, currentSort]);

  // Apply pagination
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = sortedProducts.slice(
    startIndex,
    safePage * ITEMS_PER_PAGE
  );
  const showingStart = sortedProducts.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(startIndex + paginatedProducts.length, sortedProducts.length);

  const activeCount =
    activeSubs.length +
    activeBrands.length +
    activeAvailability.length;

  // Debounced URL sync: state updates are instant; the URL is updated once
  // after a short pause so rapid facet clicks don't trigger a navigation per
  // click (fixes slow/clunky switching and race conditions). Uses `replace` so
  // the browser history isn't cluttered with every intermediate filter state.
  const syncUrl = useCallback(
    (
      subs: string[],
      brands: string[],
      availability: Availability[]
    ) => {
      const qs = buildQueryString({ subs, brands, availability });
      lastPushedUrl.current = qs;
      if (urlTimer.current) clearTimeout(urlTimer.current);
      urlTimer.current = setTimeout(() => {
        router.replace(qs, { scroll: false });
      }, 200);
    },
    [router]
  );

  /**
   * Trigger the filter-application loading state: show skeleton loaders in the
   * results area and lock the facets for a short window so the browser has time
   * to fetch and shoppers cannot click facets too quickly.
   */
  const startFacetChange = useCallback(() => {
    if (facetLoadingMs <= 0) return;
    setFacetLoading(true);
    if (facetTimer.current) clearTimeout(facetTimer.current);
    facetTimer.current = setTimeout(() => setFacetLoading(false), facetLoadingMs);
  }, [facetLoadingMs]);

  const toggleSub = (slug: string) => {
    startFacetChange();
    const node = findTreeNode(subTree, slug);
    // A node is considered "checked" if it is directly selected OR a descendant
    // is selected (the parent is visually checked when a child is selected).
    const hasSelectedDescendant =
      node?.children.some((child) =>
        isSelectedOrDescendant(child, activeSubs)
      ) ?? false;
    const checked = activeSubs.includes(slug) || hasSelectedDescendant;

    // If the node is not checked, select it (single-select).
    if (!checked) {
      setActiveSubs([slug]);
      syncUrl([slug], activeBrands, activeAvailability);
      setCurrentPage(1);
      return;
    }

    // The node IS checked. Determine what to do on deselect:
    // - If the node has a parent in the tree: unselecting it moves the filter
    //   UP to its immediate parent (the filter narrows to the parent's
    //   products), keeping the top-level category selected.
    // - If the node is a top-level node (no parent): unselecting it must clear
    //   the node AND all its descendants.
    const parentSlug = findParentSlug(subTree, slug);
    if (parentSlug) {
      // Deselect a child/intermediate node → move up to its parent.
      const next = [parentSlug];
      setActiveSubs(next);
      syncUrl(next, activeBrands, activeAvailability);
    } else {
      // Deselect a top-level node → clear everything under it.
      setActiveSubs([]);
      syncUrl([], activeBrands, activeAvailability);
    }
    setCurrentPage(1);
  };

  const toggleBrand = (brand: string) => {
    startFacetChange();
    const next = activeBrands.includes(brand)
      ? activeBrands.filter((b) => b !== brand)
      : [...activeBrands, brand]; // multi-select
    setActiveBrands(next);
    syncUrl(activeSubs, next, activeAvailability);
    setCurrentPage(1);
  };

  const toggleAvailability = (value: Availability) => {
    startFacetChange();
    const next = activeAvailability.includes(value)
      ? activeAvailability.filter((a) => a !== value)
      : [...activeAvailability, value]; // multi-select
    setActiveAvailability(next);
    syncUrl(activeSubs, activeBrands, next);
    setCurrentPage(1);
  };

  const clearAll = () => {
    startFacetChange();
    setActiveSubs([]);
    setActiveBrands([]);
    setActiveAvailability([]);
    router.push("?", { scroll: false });
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    setCurrentSort(sort);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const subOptions = (subCategories ?? [])
    .filter((s) => visibleSubs.includes(s.slug))
    .map((s) => ({
      value: s.slug,
      label: s.name,
      count: facetCounts.subCounts.get(s.slug),
    }));

  // Top-level nodes for the hierarchical facet (each carries its full subtree).
  const subNodes = subTree.filter((n) => visibleSubs.includes(n.slug));
  const subCounts = Object.fromEntries(facetCounts.subCounts);

  const brandOptions = visibleBrands.map((b) => ({
    value: b,
    label: b,
    count: facetCounts.brandCounts.get(b),
  }));

  const availabilityOptions = AVAILABILITY_OPTIONS.filter((o) =>
    visibleAvailability.has(o.value)
  ).map((o) => ({
    value: o.value,
    label: o.label,
    count: facetCounts.availabilityCounts.get(o.value),
  }));

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <main className="flex-1 overflow-x-hidden">
        <CategoryHero
          categoryName={category.name}
          description={category.description}
          backgroundImage={category.backgroundImage}
        />
        <FilterBar
          totalResults={filteredProducts.length}
          showingStart={showingStart}
          showingEnd={showingEnd}
          activeCount={activeCount}
          currentSort={currentSort}
          onSortChange={handleSortChange}
          activeSubs={activeSubs}
          activeBrands={activeBrands}
          activeAvailability={activeAvailability}
          subOptions={subOptions}
          subNodes={subNodes}
          expandedSubs={expandedSubs}
          subCounts={subCounts}
          brandOptions={brandOptions}
          availabilityOptions={availabilityOptions}
          onToggleSub={toggleSub}
          onToggleBrand={toggleBrand}
          onToggleAvailability={toggleAvailability}
          onClearAll={clearAll}
          disabled={facetLoading}
        >
          {facetLoading ? (
            <ProductGridSkeleton />
          ) : (
            <>
              <ProductGrid products={paginatedProducts} fill />
              {sortedProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 px-5 py-20 lg:px-20">
                  <p className="text-lg font-semibold text-text-primary">
                    No products match your filters
                  </p>
                  <p className="text-sm text-text-muted">
                    Try adjusting or clearing your filters.
                  </p>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="rounded-md bg-zeeks-purple px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zeeks-purple/90"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </FilterBar>
      </main>
      <Footer />
    </div>
  );
}