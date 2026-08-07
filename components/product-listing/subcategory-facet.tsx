"use client";

import type { CategoryTreeNode } from "@/lib/square/catalog";
import { cn } from "@/lib/utils";

interface SubcategoryFacetProps {
  /** The hierarchical subcategory tree (direct children + descendants). */
  nodes: CategoryTreeNode[];
  /** Slugs of currently selected subcategories (single-select filter). */
  selectedSlugs: string[];
  /**
   * Slugs of nodes whose children should be revealed. This is the EXPANDED
   * (drill-down reveal) state, distinct from the filter selection. When a child
   * is selected its ancestors stay expanded so the parent's children remain
   * visible. Falls back to `selectedSlugs` when not provided (backward compat).
   */
  expandedSlugs?: string[];
  /** Product count per subcategory slug (includes descendants). */
  countBySlug: Record<string, number>;
  onToggle: (slug: string) => void;
  className?: string;
}

/**
 * Hierarchical subcategory facet.
 *
 * Renders the top-level subcategories as checkboxes. When a subcategory is
 * selected it is revealed, showing its own child subcategories as a second,
 * indented level (and so on for deeper levels). This gives the shopper a
 * drill-down (parent → child) experience.
 *
 * Semantics: selecting a parent reveals its children AND filters products to
 * all products under that parent (parent + descendants). Selecting a child
 * filters to that child's products (child + descendants). The product filter
 * uses the product's `subCategorySlugs` path, so a selection matches any
 * product whose subcategory path contains the selected slug.
 */
export function SubcategoryFacet({
  nodes,
  selectedSlugs,
  expandedSlugs,
  countBySlug,
  onToggle,
  className,
}: SubcategoryFacetProps) {
  if (nodes.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <h3 className="font-heading text-[18px] font-extrabold uppercase tracking-wide text-text-primary">
        Categories
      </h3>
      <div className="flex flex-col gap-2">
        {nodes.map((node) => (
          <SubcategoryNode
            key={node.slug}
            node={node}
            depth={0}
            selectedSlugs={selectedSlugs}
            expandedSlugs={expandedSlugs}
            countBySlug={countBySlug}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

interface SubcategoryNodeProps {
  node: CategoryTreeNode;
  depth: number;
  selectedSlugs: string[];
  expandedSlugs?: string[];
  countBySlug: Record<string, number>;
  onToggle: (slug: string) => void;
}

/**
 * Whether a node (or any of its descendants) has a slug present in the
 * selected slugs. Used so a parent checkbox appears checked when a child
 * subcategory is selected.
 */
function isSelectedOrDescendant(
  node: CategoryTreeNode,
  selectedSlugs: string[]
): boolean {
  if (selectedSlugs.includes(node.slug)) return true;
  return node.children.some((child) => isSelectedOrDescendant(child, selectedSlugs));
}

function SubcategoryNode({
  node,
  depth,
  selectedSlugs,
  expandedSlugs,
  countBySlug,
  onToggle,
}: SubcategoryNodeProps) {
  const selected = selectedSlugs.includes(node.slug);
  // A node is visually "checked" if it is selected OR any of its descendants
  // is selected (so selecting a child checks its parent and grandparents).
  const hasSelectedDescendant = node.children.some((child) =>
    isSelectedOrDescendant(child, selectedSlugs)
  );
  const checked = selected || hasSelectedDescendant;
  // Reveal children when this node is explicitly expanded. When no expanded
  // set is provided, fall back to the legacy `selected`-driven reveal so older
  // consumers keep working unchanged.
  const expanded =
    expandedSlugs !== undefined
      ? expandedSlugs.includes(node.slug)
      : selected;
  const count = countBySlug[node.slug];

  return (
    <div className="flex flex-col gap-2">
      <label
        style={{ paddingLeft: depth > 0 ? depth * 16 : undefined }}
        className={cn(
          "flex cursor-pointer select-none items-center gap-2 text-[14px] text-text-primary"
        )}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(node.slug)}
          className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-zeeks-purple"
        />
        <span className="font-medium">{node.name}</span>
        {typeof count === "number" && (
          <span className="text-xs text-text-muted">({count})</span>
        )}
      </label>

      {/* Reveal children only for an expanded node. */}
      {expanded &&
        node.children.map((child) => (
          <SubcategoryNode
            key={child.slug}
            node={child}
            depth={depth + 1}
            selectedSlugs={selectedSlugs}
            expandedSlugs={expandedSlugs}
            countBySlug={countBySlug}
            onToggle={onToggle}
          />
        ))}
    </div>
  );
}