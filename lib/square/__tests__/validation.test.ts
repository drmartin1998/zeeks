import { describe, it, expect } from "vitest";
import {
  CatalogCategorySchema,
  CatalogItemSchema,
  ProductSchema,
  SearchParamsSchema,
  ProductSearchParamsSchema,
  ErrorResponseSchema,
} from "@/lib/square/types";

// ---------------------------------------------------------------------------
// CatalogCategorySchema
// ---------------------------------------------------------------------------

describe("CatalogCategorySchema", () => {
  it("should validate a valid top-level category", () => {
    const result = CatalogCategorySchema.safeParse({
      id: "CAT123",
      type: "CATEGORY",
      categoryData: { name: "Miniatures" },
    });
    expect(result.success).toBe(true);
  });

  it("should validate a subcategory with parentCategoryId", () => {
    const result = CatalogCategorySchema.safeParse({
      id: "SUB456",
      type: "CATEGORY",
      categoryData: { name: "Warhammer 40K", parentCategoryId: "CAT123" },
    });
    expect(result.success).toBe(true);
  });

  it("should reject a category with missing id", () => {
    const result = CatalogCategorySchema.safeParse({
      type: "CATEGORY",
      categoryData: { name: "Miniatures" },
    });
    expect(result.success).toBe(false);
  });

  it("should reject a category with wrong type", () => {
    const result = CatalogCategorySchema.safeParse({
      id: "CAT123",
      type: "ITEM",
      categoryData: { name: "Miniatures" },
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CatalogItemSchema
// ---------------------------------------------------------------------------

describe("CatalogItemSchema", () => {
  it("should validate a valid item with price", () => {
    const result = CatalogItemSchema.safeParse({
      id: "ITEM1",
      type: "ITEM",
      itemData: {
        name: "Space Marines",
        variations: [
          {
            type: "ITEM_VARIATION",
            itemVariationData: {
              priceMoney: { amount: BigInt(5000), currency: "USD" },
            },
          },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it("should validate an item with optional fields", () => {
    const result = CatalogItemSchema.safeParse({
      id: "ITEM2",
      type: "ITEM",
      itemData: {
        name: "Ork Boyz",
        description: "Green meanies",
        categories: [{ id: "CAT123" }, { id: "SUB456" }],
      },
    });
    expect(result.success).toBe(true);
  });

  it("should reject item with missing itemData", () => {
    const result = CatalogItemSchema.safeParse({
      id: "ITEM3",
      type: "ITEM",
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-ITEM type", () => {
    const result = CatalogItemSchema.safeParse({
      id: "X",
      type: "CATEGORY",
      itemData: { name: "Test" },
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ProductSchema
// ---------------------------------------------------------------------------

describe("ProductSchema", () => {
  it("should validate a complete product", () => {
    const result = ProductSchema.safeParse({
      id: "ITEM1",
      title: "Space Marines",
      category: "Miniatures",
      categorySlug: "miniatures",
      price: 50,
      gradient: "from-red-500 to-red-700",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("USD");
    }
  });

  it("should validate a product with all optional fields", () => {
    const result = ProductSchema.safeParse({
      id: "ITEM2",
      title: "Ork Boyz",
      description: "A set of ork boyz",
      category: "Miniatures",
      categorySlug: "miniatures",
      subCategory: "Warhammer 40K",
      subCategorySlug: "warhammer-40k",
      price: 35,
      currency: "USD",
      imageUrl: "https://example.com/img.jpg",
      gradient: "from-green-500 to-green-700",
    });
    expect(result.success).toBe(true);
  });

  it("should reject negative price", () => {
    const result = ProductSchema.safeParse({
      id: "ITEM3",
      title: "Free Item",
      category: "Test",
      categorySlug: "test",
      price: -1,
      gradient: "from-red-500 to-red-700",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing title", () => {
    const result = ProductSchema.safeParse({
      id: "ITEM4",
      title: "",
      category: "Test",
      categorySlug: "test",
      price: 0,
      gradient: "from-red-500 to-red-700",
    });
    expect(result.success).toBe(false);
  });

  it("should accept zero price (free items)", () => {
    const result = ProductSchema.safeParse({
      id: "ITEM5",
      title: "Free Digital Good",
      category: "Digital",
      categorySlug: "digital",
      price: 0,
      gradient: "from-blue-500 to-blue-700",
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SearchParamsSchema
// ---------------------------------------------------------------------------

describe("SearchParamsSchema", () => {
  it("should validate slug only", () => {
    const result = SearchParamsSchema.safeParse({ slug: "miniatures" });
    expect(result.success).toBe(true);
  });

  it("should validate slug with optional cursor", () => {
    const result = SearchParamsSchema.safeParse({
      slug: "miniatures",
      cursor: "abc123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty slug", () => {
    const result = SearchParamsSchema.safeParse({ slug: "" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ProductSearchParamsSchema
// ---------------------------------------------------------------------------

describe("ProductSearchParamsSchema", () => {
  it("should validate search query", () => {
    const result = ProductSearchParamsSchema.safeParse({ q: "warhammer" });
    expect(result.success).toBe(true);
  });

  it("should reject empty query", () => {
    const result = ProductSearchParamsSchema.safeParse({ q: "" });
    expect(result.success).toBe(false);
  });

  it("should reject missing query", () => {
    const result = ProductSearchParamsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ErrorResponseSchema
// ---------------------------------------------------------------------------

describe("ErrorResponseSchema", () => {
  it("should validate error response", () => {
    const result = ErrorResponseSchema.safeParse({
      error: "Products temporarily unavailable",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty error message", () => {
    const result = ErrorResponseSchema.safeParse({ error: "" });
    expect(result.success).toBe(false);
  });
});
