/**
 * Internal navigation category used by the NavBar component.
 */
export interface NavCategory {
  label: string;
  href: string;
  highlight?: boolean;
}

/**
 * Raw Square Catalog API response shape for a CATEGORY object.
 * Mirrors Square's CatalogObject with type === "CATEGORY".
 */
export interface SquareCatalogCategory {
  id: string;
  type: "CATEGORY";
  categoryData: {
    name: string;
    /** Indicates if the category is top-level (no parent) */
    parentCategoryId?: string;
    /** Whether the category is visible online */
    isTopLevel?: boolean;
  };
}

/**
 * Response from listing/searching catalog categories.
 */
export interface SquareCategoryResponse {
  objects?: SquareCatalogCategory[];
}

/**
 * Returns true if a Square category has no parent — i.e., it is a
 * top-level category suitable for navigation and category landing pages.
 *
 * Reusable across the application; use wherever you need to distinguish
 * top-level categories from sub-categories.
 */
export function isTopLevelCategory(sqCat: SquareCatalogCategory): boolean {
  // Square's explicit boolean flag takes priority when present
  if (typeof sqCat.categoryData.isTopLevel === "boolean") {
    return sqCat.categoryData.isTopLevel;
  }
  // Fall back: top-level = no parent
  const pid = sqCat.categoryData.parentCategoryId;
  return pid === undefined || pid === null || pid === "";
}

/**
 * Maps a Square catalog category object to the internal NavCategory type.
 * Uses the category name as the label and generates a slug-based href.
 */
export function mapSquareCategoryToNavCategory(
  sqCat: SquareCatalogCategory
): NavCategory {
  const name = sqCat.categoryData.name;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    label: name,
    href: `/categories/${slug}`,
  };
}
