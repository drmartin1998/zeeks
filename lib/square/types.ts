import { z } from "zod";

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
    /** Nested parent reference from Square API: { id?: string, ordinal?: number } */
    parentCategory?: {
      id?: string;
      ordinal?: number;
    };
    /** Whether the category is visible online */
    isTopLevel?: boolean;
    /** Channel IDs this category is assigned to in Square */
    channels?: string[];
    /** Whether this category is visible online (Square e-commerce setting) */
    onlineVisibility?: boolean;
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
  // Fall back: top-level = no parent id
  const pid = sqCat.categoryData.parentCategory?.id;
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

// ---------------------------------------------------------------------------
// Zod validation schemas for Square SDK responses (Constitution III, FR-008)
// ---------------------------------------------------------------------------

/** Validates raw Square catalog category objects. */
export const CatalogCategorySchema = z.object({
  id: z.string().min(1),
  type: z.literal("CATEGORY"),
  categoryData: z.object({
    name: z.string().min(1),
    parentCategory: z
      .object({
        id: z.string().optional(),
        ordinal: z.number().optional(),
      })
      .optional(),
    isTopLevel: z.boolean().optional(),
  }),
});

/** Validates raw Square catalog item objects. */
export const CatalogItemSchema = z.object({
  id: z.string().min(1),
  type: z.literal("ITEM"),
  itemData: z.object({
    name: z.string(),
    description: z.string().optional(),
    categories: z
      .array(z.object({ id: z.string() }))
      .optional(),
    variations: z
      .array(
        z.object({
          type: z.literal("ITEM_VARIATION"),
          itemVariationData: z
            .object({
              priceMoney: z
                .object({
                  amount: z.bigint().optional(),
                  currency: z.string().optional(),
                })
                .optional(),
            })
            .optional(),
        })
      )
      .optional(),
  }),
});

/** Validates a paginated Square catalog search response. */
export const CatalogSearchResponseSchema = z.object({
  objects: z.array(z.unknown()).optional(),
  cursor: z.string().optional(),
});

/** Validates the application-level Product shape passed to components. */
export const ProductSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  categorySlug: z.string().min(1),
  subCategory: z.string().optional(),
  subCategorySlug: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().default("USD"),
  imageUrl: z.string().optional(),
  gradient: z.string(),
});

/** Application-level product type inferred from the Zod schema. */
export type Product = z.infer<typeof ProductSchema>;

// ---------------------------------------------------------------------------
// Product Detail Page types
// ---------------------------------------------------------------------------

/** A single product variation (e.g., size "Large", color "Red"). */
export interface ProductVariation {
  id: string;
  name: string;
  sku?: string;
  price: number;
  imageUrl?: string;
  inventoryCount?: number;
}

/** Zod schema for product variation validation. */
export const ProductVariationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sku: z.string().optional(),
  price: z.number().min(0),
  imageUrl: z.string().optional(),
  inventoryCount: z.number().int().min(0).optional(),
});

/** Category breadcrumb segment. */
export const CategoryBreadcrumbSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

export type CategoryBreadcrumb = z.infer<typeof CategoryBreadcrumbSchema>;

/** Inventory availability status. */
export const InventoryStatusSchema = z.enum([
  "IN_STOCK",
  "OUT_OF_STOCK",
  "UNKNOWN",
]);

export type InventoryStatus = z.infer<typeof InventoryStatusSchema>;

/** Enriched product data for the product detail page. */
export const ProductDetailSchema = ProductSchema.extend({
  slug: z.string().min(1),
  images: z.array(z.string()),
  variations: z.array(ProductVariationSchema),
  category: CategoryBreadcrumbSchema,
  subCategory: CategoryBreadcrumbSchema.optional(),
  inventoryStatus: InventoryStatusSchema,
  relatedProducts: z.array(ProductSchema).default([]),
});

export type ProductDetail = z.infer<typeof ProductDetailSchema>;

/** Validates query parameters for the products Route Handler. */
export const SearchParamsSchema = z.object({
  slug: z.string().min(1),
  cursor: z.string().optional(),
});

/** Validates search query parameters for the products/search Route Handler. */
export const ProductSearchParamsSchema = z.object({
  q: z.string().min(1, "Search query is required"),
  cursor: z.string().optional(),
});

/** Standard error response shape. */
export const ErrorResponseSchema = z.object({
  error: z.string().min(1),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Display-oriented product shape used by client components.
 * Subset of Product with only the fields needed for rendering.
 */
export interface DisplayProduct {
  slug: string;
  title: string;
  category: string;
  price: number;
  image?: string;
  gradient?: string;
}

/**
 * Category data for product listing pages.
 */
export interface CategoryDisplayData {
  slug: string;
  name: string;
  description: string;
  backgroundImage?: string;
}
