import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

// Mock the catalog API for both search (categories) and searchItems (products)
vi.mock("@/lib/square/client", () => ({
  catalogApi: {
    search: vi.fn().mockResolvedValue({}),
    searchItems: vi.fn().mockResolvedValue({}),
    batchGet: vi.fn().mockResolvedValue({}),
  },
  locationId: "TEST_LOCATION",
}));

// Allowlisted category IDs
const MINIATURES_ID = "ZCZJWQX6WREDLATZFW3U7OCJ";

describe("getSquareProductsByCategorySlug pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should accumulate items across multiple cursor pages", async () => {
    const { getSquareProductsByCategorySlug } = await import(
      "@/lib/square/catalog"
    );

    // Mock fetchAllCategories: one allowlisted parent + one subcategory
    const mockCategorySearch = vi.fn().mockResolvedValue({
      objects: [
        {
          id: MINIATURES_ID,
          type: "CATEGORY" as const,
          categoryData: { name: "Miniatures", channels: ["TEST_CHANNEL"] },
        },
        {
          id: "SUB1",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Warhammer 40K",
            parentCategory: { id: MINIATURES_ID },
            channels: ["TEST_CHANNEL"],
          },
        },
      ],
    });

    const { catalogApi } = await import("@/lib/square/client");
    vi.mocked(catalogApi.search).mockImplementation(mockCategorySearch);

    // Mock searchItems: page 1 with cursor, page 2 without cursor
    const mockSearchItems = vi.fn()
      .mockResolvedValueOnce({
        items: [
          {
            type: "ITEM",
            id: "ITEM1",
            itemData: {
              name: "Space Marines",
              variations: [
                {
                  type: "ITEM_VARIATION",
                  itemVariationData: {
                    priceMoney: { amount: 5000n, currency: "USD" },
                  },
                },
              ],
            },
          },
          {
            type: "ITEM",
            id: "ITEM2",
            itemData: {
              name: "Ork Boyz",
              variations: [
                {
                  type: "ITEM_VARIATION",
                  itemVariationData: {
                    priceMoney: { amount: 3500n, currency: "USD" },
                  },
                },
              ],
            },
          },
        ],
        cursor: "page2cursor",
      })
      .mockResolvedValueOnce({
        items: [
          {
            type: "ITEM",
            id: "ITEM3",
            itemData: {
              name: "Necron Warriors",
              variations: [
                {
                  type: "ITEM_VARIATION",
                  itemVariationData: {
                    priceMoney: { amount: 4500n, currency: "USD" },
                  },
                },
              ],
            },
          },
        ],
      });

    vi.mocked(catalogApi.searchItems).mockImplementation(mockSearchItems);

    const products = await getSquareProductsByCategorySlug("miniatures");

    expect(products).not.toBeNull();
    expect(products!.length).toBe(3);
    expect(products!.map((p) => p.title)).toEqual([
      "Space Marines",
      "Ork Boyz",
      "Necron Warriors",
    ]);
    expect(mockSearchItems).toHaveBeenCalledTimes(2);

    // Verify searchItems was called with correct parameters
    const searchCalls = mockSearchItems.mock.calls;
    expect(searchCalls[0][0]).toMatchObject({
      categoryIds: expect.arrayContaining([MINIATURES_ID]),
      limit: 100,
    });
    expect(searchCalls[1][0]).toMatchObject({
      cursor: "page2cursor",
      limit: 100,
    });
  });

  it("should return null for non-allowlisted category slug", async () => {
    const { getSquareCategoryBySlug } = await import(
      "@/lib/square/catalog"
    );

    // Mock fetchAllCategories: non-allowlisted parent
    const mockSearch = vi.fn().mockResolvedValue({
      objects: [
        {
          id: "NON_ALLOWLISTED",
          type: "CATEGORY" as const,
          categoryData: { name: "Board Games", channels: ["TEST_CHANNEL"] },
        },
      ],
    });

    vi.mocked((await import("@/lib/square/client")).catalogApi.search).mockImplementation(mockSearch);

    const category = await getSquareCategoryBySlug("board-games");
    expect(category).toBeNull();
  });

  it("should find allowlisted category by slug", async () => {
    const { getSquareCategoryBySlug } = await import(
      "@/lib/square/catalog"
    );

    const mockSearch = vi.fn().mockResolvedValue({
      objects: [
        {
          id: MINIATURES_ID,
          type: "CATEGORY" as const,
          categoryData: { name: "Miniatures", channels: ["TEST_CHANNEL"] },
        },
      ],
    });

    vi.mocked((await import("@/lib/square/client")).catalogApi.search).mockImplementation(mockSearch);

    const category = await getSquareCategoryBySlug("miniatures");
    expect(category).not.toBeNull();
    expect(category!.title).toBe("Miniatures");
  });

  it("should return null when Square API fails", async () => {
    const mockSearch = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.mocked((await import("@/lib/square/client")).catalogApi.search).mockImplementation(mockSearch);

    const { getSquareProductsByCategorySlug } = await import(
      "@/lib/square/catalog"
    );

    const products = await getSquareProductsByCategorySlug("miniatures");
    expect(products).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Channel filter tests (US1)
  // -------------------------------------------------------------------------

  it("should exclude categories not in the configured channel", async () => {
    const { getSquareCategories } = await import("@/lib/square/catalog");

    const mockSearch = vi.fn().mockResolvedValue({
      objects: [
        {
          id: MINIATURES_ID,
          type: "CATEGORY" as const,
          categoryData: { name: "Miniatures", channels: ["TEST_CHANNEL"] },
        },
        {
          id: "OTHER_CAT",
          type: "CATEGORY" as const,
          categoryData: { name: "Other Category", channels: ["OTHER_CHANNEL"] },
        },
        {
          id: "SUB_IN_CHANNEL",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Sub In Channel",
            parentCategory: { id: MINIATURES_ID },
            channels: ["TEST_CHANNEL"],
          },
        },
      ],
    });

    vi.mocked(
      (await import("@/lib/square/client")).catalogApi.search
    ).mockImplementation(mockSearch);

    const categories = await getSquareCategories();
    expect(categories).toHaveLength(1);
    expect(categories[0].title).toBe("Miniatures");
  });

  it("should return empty array when SQUARE_CHANNEL_ID is not configured", async () => {
    const originalChannelId = process.env.SQUARE_CHANNEL_ID;
    delete process.env.SQUARE_CHANNEL_ID;

    const { getSquareCategories } = await import("@/lib/square/catalog");

    const mockSearch = vi.fn();
    vi.mocked(
      (await import("@/lib/square/client")).catalogApi.search
    ).mockImplementation(mockSearch);

    const categories = await getSquareCategories();
    expect(categories).toEqual([]);
    expect(mockSearch).not.toHaveBeenCalled();

    process.env.SQUARE_CHANNEL_ID = originalChannelId;
  });

  it("should exclude categories with empty channels array", async () => {
    const { getSquareCategories } = await import("@/lib/square/catalog");

    const mockSearch = vi.fn().mockResolvedValue({
      objects: [
        {
          id: MINIATURES_ID,
          type: "CATEGORY" as const,
          categoryData: { name: "Miniatures", channels: ["TEST_CHANNEL"] },
        },
        {
          id: "EMPTY_CHANNELS",
          type: "CATEGORY" as const,
          categoryData: { name: "Empty Channels", channels: [] },
        },
      ],
    });

    vi.mocked(
      (await import("@/lib/square/client")).catalogApi.search
    ).mockImplementation(mockSearch);

    const categories = await getSquareCategories();
    expect(categories).toHaveLength(1);
    expect(categories[0].title).toBe("Miniatures");
  });
});

  // -------------------------------------------------------------------------
  // Subcategory inheritance tests (US2)
  // -------------------------------------------------------------------------

  it("should return subcategories only for channel-eligible parents", async () => {
    const { getSquareSubcategories } = await import("@/lib/square/catalog");

    const mockSearch = vi.fn().mockResolvedValue({
      objects: [
        // Parent in channel
        {
          id: MINIATURES_ID,
          type: "CATEGORY" as const,
          categoryData: { name: "Miniatures", channels: ["TEST_CHANNEL"] },
        },
        // Subcategory of channel-eligible parent
        {
          id: "SUB_IN_CHANNEL",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Games Workshop",
            parentCategory: { id: MINIATURES_ID },
            channels: ["TEST_CHANNEL"],
          },
        },
        // Parent NOT in channel
        {
          id: "EXCLUDED_PARENT",
          type: "CATEGORY" as const,
          categoryData: { name: "Excluded Parent", channels: ["OTHER_CHANNEL"] },
        },
        // Subcategory of excluded parent (should not appear)
        {
          id: "SUB_EXCLUDED",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Excluded Sub",
            parentCategory: { id: "EXCLUDED_PARENT" },
            channels: ["TEST_CHANNEL"],
          },
        },
      ],
    });

    vi.mocked(
      (await import("@/lib/square/client")).catalogApi.search
    ).mockImplementation(mockSearch);

    const subCategories = await getSquareSubcategories("miniatures");
    expect(subCategories).toHaveLength(1);
    expect(subCategories[0].name).toBe("Games Workshop");

    // Excluded parent should not match
    const excludedSubs = await getSquareSubcategories("excluded-parent");
    expect(excludedSubs).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // Centralization tests (US3)
  // -------------------------------------------------------------------------

  it("should return channel-filtered data when called by any consumer without additional filter logic", async () => {
    const { fetchAllCategories } = await import("@/lib/square/catalog");

    const mockSearch = vi.fn().mockResolvedValue({
      objects: [
        {
          id: MINIATURES_ID,
          type: "CATEGORY" as const,
          categoryData: {
            name: "Miniatures",
            channels: ["TEST_CHANNEL"],
          },
        },
        {
          id: "OTHER",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Excluded",
            channels: ["OTHER_CHANNEL"],
          },
        },
      ],
    });

    vi.mocked(
      (await import("@/lib/square/client")).catalogApi.search
    ).mockImplementation(mockSearch);

    // Simulate a "new consumer" — just call fetchAllCategories() directly.
    // It should return channel-filtered results without any additional filtering.
    const result = await fetchAllCategories();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(MINIATURES_ID);
  });

  it("should automatically exclude subcategories of channel-ineligible parents", async () => {
    const { fetchAllCategories } = await import("@/lib/square/catalog");

    const mockSearch = vi.fn().mockResolvedValue({
      objects: [
        {
          id: MINIATURES_ID,
          type: "CATEGORY" as const,
          categoryData: {
            name: "Miniatures",
            channels: ["TEST_CHANNEL"],
          },
        },
        {
          id: "SUB_INELIGIBLE",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Excluded Sub",
            parentCategory: { id: MINIATURES_ID },
            channels: [], // empty channels = excluded
          },
        },
      ],
    });

    vi.mocked(
      (await import("@/lib/square/client")).catalogApi.search
    ).mockImplementation(mockSearch);

    const result = await fetchAllCategories();

    // Only the parent with channels should be returned
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(MINIATURES_ID);
  });

// -------------------------------------------------------------------------
// slugify unit tests (T007)
// -------------------------------------------------------------------------

describe("slugify", () => {
  it("should lowercase and replace spaces with hyphens", async () => {
    const { slugify } = await import("@/lib/square/catalog");
    expect(slugify("Space Marines")).toBe("space-marines");
  });

  it("should handle special characters", async () => {
    const { slugify } = await import("@/lib/square/catalog");
    expect(slugify("Warhammer 40,000!")).toBe("warhammer-40-000");
  });

  it("should strip leading and trailing hyphens", async () => {
    const { slugify } = await import("@/lib/square/catalog");
    expect(slugify("- Special Offer -")).toBe("special-offer");
  });

  it("should handle empty string", async () => {
    const { slugify } = await import("@/lib/square/catalog");
    expect(slugify("")).toBe("");
  });

  it("should handle multiple consecutive non-alphanumeric characters", async () => {
    const { slugify } = await import("@/lib/square/catalog");
    expect(slugify("Red & Blue")).toBe("red-blue");
  });
});

// -------------------------------------------------------------------------
// Brand + availability extraction tests (Faceted Product Listing Filters)
// -------------------------------------------------------------------------

describe("getSquareProductsByCategorySlug brand + availability facets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function mockCategoryAndItems(items: unknown[]) {
    const { catalogApi } = await import("@/lib/square/client");
    vi.mocked(catalogApi.search).mockResolvedValue({
      objects: [
        {
          id: MINIATURES_ID,
          type: "CATEGORY" as const,
          categoryData: { name: "Miniatures", channels: ["TEST_CHANNEL"] },
        },
      ],
    });
    vi.mocked(catalogApi.searchItems).mockResolvedValue({
      items: items as never,
    });
  }

  it("should surface the brand custom attribute on each product", async () => {
    await mockCategoryAndItems([
      {
        type: "ITEM",
        id: "ITEM_BRANDED",
        itemData: {
          name: "Space Marines",
          customAttributeValues: {
            brand: { stringValue: "Games Workshop" },
          },
          variations: [
            {
              type: "ITEM_VARIATION",
              itemVariationData: {
                priceMoney: { amount: 5000n, currency: "USD" },
              },
            },
          ],
        },
      },
      {
        type: "ITEM",
        id: "ITEM_NO_BRAND",
        itemData: {
          name: "Ork Boyz",
          customAttributeValues: {},
          variations: [
            {
              type: "ITEM_VARIATION",
              itemVariationData: {
                priceMoney: { amount: 3500n, currency: "USD" },
              },
            },
          ],
        },
      },
    ]);

    const { getSquareProductsByCategorySlug } = await import(
      "@/lib/square/catalog"
    );
    const products = await getSquareProductsByCategorySlug("miniatures");

    expect(products).not.toBeNull();
    const byTitle = Object.fromEntries(
      products!.map((p) => [p.title, p.brand])
    );
    expect(byTitle["Space Marines"]).toBe("Games Workshop");
    expect(byTitle["Ork Boyz"]).toBeUndefined();
  });

  it("should classify a product as IN_STOCK when any variation is available", async () => {
    await mockCategoryAndItems([
      {
        type: "ITEM",
        id: "ITEM_MIXED",
        itemData: {
          name: "Mixed Box",
          variations: [
            {
              type: "ITEM_VARIATION",
              itemVariationData: {
                priceMoney: { amount: 5000n, currency: "USD" },
                locationOverrides: [
                  { locationId: "TEST_LOCATION", soldOut: true },
                ],
              },
            },
            {
              type: "ITEM_VARIATION",
              itemVariationData: {
                priceMoney: { amount: 6000n, currency: "USD" },
                locationOverrides: [
                  { locationId: "TEST_LOCATION", soldOut: false },
                ],
              },
            },
          ],
        },
      },
    ]);

    const { getSquareProductsByCategorySlug } = await import(
      "@/lib/square/catalog"
    );
    const products = await getSquareProductsByCategorySlug("miniatures");

    expect(products).not.toBeNull();
    expect(products![0].availability).toBe("IN_STOCK");
  });

  it("should classify a product as OUT_OF_STOCK when all variations are sold out", async () => {
    await mockCategoryAndItems([
      {
        type: "ITEM",
        id: "ITEM_SOLD_OUT",
        itemData: {
          name: "Sold Out Set",
          variations: [
            {
              type: "ITEM_VARIATION",
              itemVariationData: {
                priceMoney: { amount: 5000n, currency: "USD" },
                locationOverrides: [
                  { locationId: "TEST_LOCATION", soldOut: true },
                ],
              },
            },
          ],
        },
      },
    ]);

    const { getSquareProductsByCategorySlug } = await import(
      "@/lib/square/catalog"
    );
    const products = await getSquareProductsByCategorySlug("miniatures");

    expect(products).not.toBeNull();
    expect(products![0].availability).toBe("OUT_OF_STOCK");
  });

  it("should default a product with no location override data to IN_STOCK", async () => {
    await mockCategoryAndItems([
      {
        type: "ITEM",
        id: "ITEM_NO_OVERRIDE",
        itemData: {
          name: "No Override Item",
          variations: [
            {
              type: "ITEM_VARIATION",
              itemVariationData: {
                priceMoney: { amount: 2500n, currency: "USD" },
              },
            },
          ],
        },
      },
    ]);

    const { getSquareProductsByCategorySlug } = await import(
      "@/lib/square/catalog"
    );
    const products = await getSquareProductsByCategorySlug("miniatures");

    expect(products).not.toBeNull();
    expect(products![0].availability).toBe("IN_STOCK");
  });
});

// -------------------------------------------------------------------------
// Listing image resolution (bug fix: product images not displayed)
// -------------------------------------------------------------------------

describe("getSquareProductsByCategorySlug image resolution", () => {
  const ORIGINAL_CHANNEL_ID = process.env.SQUARE_CHANNEL_ID;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SQUARE_CHANNEL_ID = "TEST_CHANNEL";
  });

  afterAll(() => {
    if (ORIGINAL_CHANNEL_ID === undefined) {
      delete process.env.SQUARE_CHANNEL_ID;
    } else {
      process.env.SQUARE_CHANNEL_ID = ORIGINAL_CHANNEL_ID;
    }
  });

  async function mockCategoryAndItems(items: unknown[]) {
    const { catalogApi } = await import("@/lib/square/client");
    vi.mocked(catalogApi.search).mockResolvedValue({
      objects: [
        {
          id: MINIATURES_ID,
          type: "CATEGORY" as const,
          categoryData: { name: "Miniatures", channels: ["TEST_CHANNEL"] },
        },
      ],
    });
    vi.mocked(catalogApi.searchItems).mockResolvedValue({
      items: items as never,
    });
  }

  it("should resolve the primary image URL from batched IMAGE objects", async () => {
    await mockCategoryAndItems([
      {
        type: "ITEM",
        id: "ITEM_WITH_IMG",
        itemData: {
          name: "Adepta Sororitas",
          imageIds: ["IMG_1", "IMG_2"],
          variations: [
            {
              type: "ITEM_VARIATION",
              itemVariationData: {
                priceMoney: { amount: 5000n, currency: "USD" },
              },
            },
          ],
        },
      },
      {
        type: "ITEM",
        id: "ITEM_NO_IMG",
        itemData: {
          name: "Ork Boyz",
          variations: [
            {
              type: "ITEM_VARIATION",
              itemVariationData: {
                priceMoney: { amount: 3500n, currency: "USD" },
              },
            },
          ],
        },
      },
    ]);

    const { catalogApi } = await import("@/lib/square/client");
    vi.mocked(catalogApi.batchGet).mockResolvedValue({
      objects: [
        {
          type: "IMAGE",
          id: "IMG_1",
          imageData: { url: "https://square.example/img1.png" },
        },
        {
          type: "IMAGE",
          id: "IMG_2",
          imageData: { url: "https://square.example/img2.png" },
        },
      ] as never,
    });

    const { getSquareProductsByCategorySlug } = await import(
      "@/lib/square/catalog"
    );
    const products = await getSquareProductsByCategorySlug("miniatures");

    expect(products).not.toBeNull();
    const byTitle = Object.fromEntries(
      products!.map((p) => [p.title, p.image])
    );

    // Primary (first) image URL is used for items that have images.
    expect(byTitle["Adepta Sororitas"]).toBe("https://square.example/img1.png");
    // Items with no images keep image: "" (gradient placeholder).
    expect(byTitle["Ork Boyz"]).toBe("");

    // batchGet must be called with the collected image IDs.
    expect(catalogApi.batchGet).toHaveBeenCalledWith({
      objectIds: ["IMG_1", "IMG_2"],
    });
  });

  it("should fall back to variation-level image IDs when the item has none", async () => {
    await mockCategoryAndItems([
      {
        type: "ITEM",
        id: "ITEM_VAR_IMG",
        itemData: {
          name: "Stormcast Eternals",
          // no item-level imageIds
          variations: [
            {
              type: "ITEM_VARIATION",
              itemVariationData: {
                priceMoney: { amount: 4500n, currency: "USD" },
                imageIds: ["VAR_IMG_1"],
              },
            },
          ],
        },
      },
    ]);

    const { catalogApi } = await import("@/lib/square/client");
    vi.mocked(catalogApi.batchGet).mockResolvedValue({
      objects: [
        {
          type: "IMAGE",
          id: "VAR_IMG_1",
          imageData: { url: "https://square.example/varimg.png" },
        },
      ] as never,
    });

    const { getSquareProductsByCategorySlug } = await import(
      "@/lib/square/catalog"
    );
    const products = await getSquareProductsByCategorySlug("miniatures");

    expect(products).not.toBeNull();
    expect(products![0].image).toBe("https://square.example/varimg.png");
  });

  it("should conserve batchGet calls when no items have images", async () => {
    await mockCategoryAndItems([
      {
        type: "ITEM",
        id: "ITEM_BLANK",
        itemData: {
          name: "Plain Item",
          variations: [
            {
              type: "ITEM_VARIATION",
              itemVariationData: {
                priceMoney: { amount: 2000n, currency: "USD" },
              },
            },
          ],
        },
      },
    ]);

    const { catalogApi } = await import("@/lib/square/client");
    const products = await (
      await import("@/lib/square/catalog")
    ).getSquareProductsByCategorySlug("miniatures");

    expect(products).not.toBeNull();
    expect(products![0].image).toBe("");
    // No image IDs collected → batchGet must not be called.
    expect(catalogApi.batchGet).not.toHaveBeenCalled();
  });
});

// -------------------------------------------------------------------------
// Recursive (nested) subcategory behavior — "Games Workshop" bug fix
// -------------------------------------------------------------------------

describe("getSquareProductsByCategorySlug recursive nested subcategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Builds a category tree:
   *  Miniatures (top-level)
   *    ├── Games Workshop (direct child, NO products assigned directly)
   *    │     ├── Space Marines (sub-subcategory → holds products)
   *    │     └── Age of Sigmar   (sub-subcategory → holds products)
   *    └── Paints (direct child → holds products directly)
   */
  async function mockNestedTree() {
    const { catalogApi } = await import("@/lib/square/client");
    vi.mocked(catalogApi.search).mockResolvedValue({
      objects: [
        {
          id: MINIATURES_ID,
          type: "CATEGORY" as const,
          categoryData: { name: "Miniatures", channels: ["TEST_CHANNEL"] },
        },
        {
          id: "GW",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Games Workshop",
            parentCategory: { id: MINIATURES_ID },
            channels: ["TEST_CHANNEL"],
          },
        },
        {
          id: "SM",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Space Marines",
            parentCategory: { id: "GW" },
            channels: ["TEST_CHANNEL"],
          },
        },
        {
          id: "AOS",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Age of Sigmar",
            parentCategory: { id: "GW" },
            channels: ["TEST_CHANNEL"],
          },
        },
        {
          id: "PAINT",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Paints",
            parentCategory: { id: MINIATURES_ID },
            channels: ["TEST_CHANNEL"],
          },
        },
      ],
    });
  }

  it("should fetch products assigned to nested (2-level-deep) subcategories", async () => {
    await mockNestedTree();

    const { catalogApi } = await import("@/lib/square/client");
    vi.mocked(catalogApi.searchItems).mockResolvedValue({
      items: [
        {
          type: "ITEM",
          id: "ITEM_SM",
          itemData: {
            name: "Space Marine Squad",
            categories: [{ id: "SM" }],
            variations: [
              {
                type: "ITEM_VARIATION",
                itemVariationData: {
                  priceMoney: { amount: 5000n, currency: "USD" },
                },
              },
            ],
          },
        },
        {
          type: "ITEM",
          id: "ITEM_AOS",
          itemData: {
            name: "Stormcast Eternals",
            categories: [{ id: "AOS" }],
            variations: [
              {
                type: "ITEM_VARIATION",
                itemVariationData: {
                  priceMoney: { amount: 4500n, currency: "USD" },
                },
              },
            ],
          },
        },
      ] as never,
    });

    const { getSquareProductsByCategorySlug } = await import(
      "@/lib/square/catalog"
    );
    const products = await getSquareProductsByCategorySlug("miniatures");

    expect(products).not.toBeNull();
    // Both nested products must be fetched (they live 2 levels deep)
    expect(products!.map((p) => p.title).sort()).toEqual([
      "Space Marine Squad",
      "Stormcast Eternals",
    ]);
  });

  it("should annotate a nested product with its nearest top-level-child ancestor", async () => {
    await mockNestedTree();

    const { catalogApi } = await import("@/lib/square/client");
    vi.mocked(catalogApi.searchItems).mockResolvedValue({
      items: [
        {
          type: "ITEM",
          id: "ITEM_SM",
          itemData: {
            name: "Space Marine Squad",
            categories: [{ id: "SM" }],
            variations: [
              {
                type: "ITEM_VARIATION",
                itemVariationData: {
                  priceMoney: { amount: 5000n, currency: "USD" },
                },
              },
            ],
          },
        },
      ] as never,
    });

    const { getSquareProductsByCategorySlug } = await import(
      "@/lib/square/catalog"
    );
    const products = await getSquareProductsByCategorySlug("miniatures");

    // The search must include the nested sub-subcategory IDs (SM, AOS)
    const searchCalls = vi.mocked(catalogApi.searchItems).mock.calls;
    const searchedCategoryIds = searchCalls[0]?.[0]?.categoryIds as
      | string[]
      | undefined;
    expect(searchedCategoryIds).toEqual(
      expect.arrayContaining([MINIATURES_ID, "GW", "SM", "AOS", "PAINT"])
    );

    // The product rolls up to "Games Workshop" (nearest top-level child)
    expect(products).not.toBeNull();
    expect(products![0].subCategory).toBe("Games Workshop");
    expect(products![0].subCategorySlug).toBe("games-workshop");
  });

  it("should build a subcategory tree that maps every descendant to its facet subcategory", async () => {
    const { buildSubcategoryTree } = await import("@/lib/square/catalog");

    const { catalogApi } = await import("@/lib/square/client");
    vi.mocked(catalogApi.search).mockResolvedValue({
      objects: [
        {
          id: MINIATURES_ID,
          type: "CATEGORY" as const,
          categoryData: { name: "Miniatures", channels: ["TEST_CHANNEL"] },
        },
        {
          id: "GW",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Games Workshop",
            parentCategory: { id: MINIATURES_ID },
            channels: ["TEST_CHANNEL"],
          },
        },
        {
          id: "SM",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Space Marines",
            parentCategory: { id: "GW" },
            channels: ["TEST_CHANNEL"],
          },
        },
        {
          id: "AOS",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Age of Sigmar",
            parentCategory: { id: "GW" },
            channels: ["TEST_CHANNEL"],
          },
        },
      ],
    });

    const { fetchAllCategories } = await import("@/lib/square/catalog");
    const allCats = await fetchAllCategories();

    const { descendantIds, subByDescendantId } = buildSubcategoryTree(
      allCats,
      MINIATURES_ID
    );

    // All descendants (both depths) are captured
    expect(descendantIds).toEqual(expect.arrayContaining(["GW", "SM", "AOS"]));

    // Every descendant maps to its nearest top-level child ("GW")
    expect(subByDescendantId.get("GW")?.slug).toBe("games-workshop");
    expect(subByDescendantId.get("SM")?.slug).toBe("games-workshop");
    expect(subByDescendantId.get("AOS")?.slug).toBe("games-workshop");
    expect(subByDescendantId.get("SM")?.name).toBe("Games Workshop");
  });
});

// -------------------------------------------------------------------------
// Category tree building (drill-down facet reveal)
// -------------------------------------------------------------------------

describe("buildCategoryTree", () => {
  it("should build a nested tree of direct children and their descendants", async () => {
    const { buildCategoryTree } = await import("@/lib/square/catalog");

    const { catalogApi } = await import("@/lib/square/client");
    vi.mocked(catalogApi.search).mockResolvedValue({
      objects: [
        {
          id: MINIATURES_ID,
          type: "CATEGORY" as const,
          categoryData: { name: "Miniatures", channels: ["TEST_CHANNEL"] },
        },
        {
          id: "GW",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Games Workshop",
            parentCategory: { id: MINIATURES_ID },
            channels: ["TEST_CHANNEL"],
          },
        },
        {
          id: "SM",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Space Marines",
            parentCategory: { id: "GW" },
            channels: ["TEST_CHANNEL"],
          },
        },
        {
          id: "AOS",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Age of Sigmar",
            parentCategory: { id: "GW" },
            channels: ["TEST_CHANNEL"],
          },
        },
        {
          id: "PAINT",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Paints",
            parentCategory: { id: MINIATURES_ID },
            channels: ["TEST_CHANNEL"],
          },
        },
      ],
    });

    const { fetchAllCategories } = await import("@/lib/square/catalog");
    const allCats = await fetchAllCategories();

    const tree = buildCategoryTree(allCats, MINIATURES_ID);

    // Two direct children: Games Workshop and Paints
    expect(tree.map((n) => n.slug)).toEqual(["games-workshop", "paints"]);

    // Games Workshop carries its grandchildren as a nested `children` level
    const gw = tree[0];
    expect(gw.children.map((c) => c.slug)).toEqual([
      "space-marines",
      "age-of-sigmar",
    ]);
    // Those grandchildren are leaves (no deeper children)
    expect(gw.children.every((c) => c.children.length === 0)).toBe(true);

    // Paints is a leaf
    expect(tree[1].children).toEqual([]);
  });

  it("should return an empty array when the parent has no subcategories", async () => {
    const { buildCategoryTree } = await import("@/lib/square/catalog");

    const { catalogApi } = await import("@/lib/square/client");
    vi.mocked(catalogApi.search).mockResolvedValue({
      objects: [
        {
          id: MINIATURES_ID,
          type: "CATEGORY" as const,
          categoryData: { name: "Miniatures", channels: ["TEST_CHANNEL"] },
        },
      ],
    });

    const { fetchAllCategories } = await import("@/lib/square/catalog");
    const allCats = await fetchAllCategories();

    const tree = buildCategoryTree(allCats, MINIATURES_ID);
    expect(tree).toEqual([]);
  });
});

describe("flattenCategoryTree", () => {
  it("should map every category ID to its slug path from the top child down", async () => {
    const { buildCategoryTree, flattenCategoryTree } = await import(
      "@/lib/square/catalog"
    );

    const { catalogApi } = await import("@/lib/square/client");
    vi.mocked(catalogApi.search).mockResolvedValue({
      objects: [
        {
          id: MINIATURES_ID,
          type: "CATEGORY" as const,
          categoryData: { name: "Miniatures", channels: ["TEST_CHANNEL"] },
        },
        {
          id: "GW",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Games Workshop",
            parentCategory: { id: MINIATURES_ID },
            channels: ["TEST_CHANNEL"],
          },
        },
        {
          id: "SM",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Space Marines",
            parentCategory: { id: "GW" },
            channels: ["TEST_CHANNEL"],
          },
        },
      ],
    });

    const { fetchAllCategories } = await import("@/lib/square/catalog");
    const allCats = await fetchAllCategories();

    const tree = buildCategoryTree(allCats, MINIATURES_ID);
    const { slugPathByCategoryId } = flattenCategoryTree(tree);

    // Direct child maps to a single-element path
    expect(slugPathByCategoryId.get("GW")).toEqual(["games-workshop"]);
    // Grandchild maps to the top child → grandchild path (enables drill-down)
    expect(slugPathByCategoryId.get("SM")).toEqual([
      "games-workshop",
      "space-marines",
    ]);
  });
});

// -------------------------------------------------------------------------
// PDP breadcrumb — full category path resolution (bug fix)
// -------------------------------------------------------------------------

describe("getProductDetailBySlug category breadcrumb path", () => {
  const ORIGINAL_CHANNEL_ID = process.env.SQUARE_CHANNEL_ID;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SQUARE_CHANNEL_ID = "TEST_CHANNEL";
  });

  afterAll(() => {
    if (ORIGINAL_CHANNEL_ID === undefined) {
      delete process.env.SQUARE_CHANNEL_ID;
    } else {
      process.env.SQUARE_CHANNEL_ID = ORIGINAL_CHANNEL_ID;
    }
  });

  /**
   * Category tree: Miniatures (top-level) → Games Workshop → Warhammer 40K.
   * The product "Adepta Sororitas" lives in the deepest category (Warhammer 40K).
   */
  async function mockDeepHierarchy() {
    const { catalogApi } = await import("@/lib/square/client");

    vi.mocked(catalogApi.search).mockResolvedValue({
      objects: [
        {
          id: MINIATURES_ID,
          type: "CATEGORY" as const,
          categoryData: { name: "Miniatures", channels: ["TEST_CHANNEL"] },
        },
        {
          id: "GW",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Games Workshop",
            parentCategory: { id: MINIATURES_ID },
            channels: ["TEST_CHANNEL"],
          },
        },
        {
          id: "WH40K",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Warhammer 40K",
            parentCategory: { id: "GW" },
            channels: ["TEST_CHANNEL"],
          },
        },
      ],
    });

    // Step 1: slug search returns the item.
    vi.mocked(catalogApi.searchItems).mockResolvedValueOnce({
      items: [
        {
          type: "ITEM",
          id: "ITEM_ADE",
          itemData: {
            name: "Adepta Sororitas",
            categories: [{ id: "WH40K" }],
          },
        },
      ],
    });

    // Step 3: batchGet returns full item detail (variations etc.).
    vi.mocked(catalogApi.batchGet).mockResolvedValue({
      objects: [
        {
          type: "ITEM",
          id: "ITEM_ADE",
          itemData: {
            name: "Adepta Sororitas",
            categories: [{ id: "WH40K" }],
            variations: [
              {
                type: "ITEM_VARIATION",
                itemVariationData: {
                  priceMoney: { amount: 5000n, currency: "USD" },
                },
              },
            ],
          },
        },
      ] as never,
      relatedObjects: [] as never,
    });
  }

  it("should resolve the top-level category and full path for a deeply nested product", async () => {
    await mockDeepHierarchy();

    const { getProductDetailBySlug } = await import("@/lib/square/catalog");
    const product = await getProductDetailBySlug("adepta-sororitas");

    expect(product).not.toBeNull();
    // `category` must be the TOP-LEVEL category so the breadcrumb link works.
    expect(product!.category).toEqual({
      name: "Miniatures",
      slug: "miniatures",
    });
    // `subCategory` is the product's own (deepest) subcategory.
    expect(product!.subCategory).toEqual({
      name: "Warhammer 40K",
      slug: "warhammer-40k",
    });
    // Full path, top-level first: Miniatures → Games Workshop → Warhammer 40K.
    expect(product!.categoryPath).toEqual([
      { name: "Miniatures", slug: "miniatures" },
      { name: "Games Workshop", slug: "games-workshop" },
      { name: "Warhammer 40K", slug: "warhammer-40k" },
    ]);
  });

  it("should fall back to Uncategorized when the product has no category", async () => {
    const { catalogApi } = await import("@/lib/square/client");

    vi.mocked(catalogApi.search).mockResolvedValue({ objects: [] });

    vi.mocked(catalogApi.searchItems).mockResolvedValueOnce({
      items: [
        {
          type: "ITEM",
          id: "ITEM_NO_CAT",
          itemData: {
            name: "No Category Item",
            categories: [],
          },
        },
      ],
    });

    vi.mocked(catalogApi.batchGet).mockResolvedValue({
      objects: [
        {
          type: "ITEM",
          id: "ITEM_NO_CAT",
          itemData: {
            name: "No Category Item",
            variations: [
              {
                type: "ITEM_VARIATION",
                itemVariationData: {
                  priceMoney: { amount: 1000n, currency: "USD" },
                },
              },
            ],
          },
        },
      ] as never,
      relatedObjects: [] as never,
    });

    const { getProductDetailBySlug } = await import("@/lib/square/catalog");
    const product = await getProductDetailBySlug("no-category-item");

    expect(product).not.toBeNull();
    expect(product!.category).toEqual({
      name: "Uncategorized",
      slug: "uncategorized",
    });
    expect(product!.categoryPath).toEqual([
      { name: "Uncategorized", slug: "uncategorized" },
    ]);
    expect(product!.subCategory).toBeUndefined();
  });

  it("should pick a visible category when categories[0] is excluded but a later category is valid", async () => {
    const { catalogApi } = await import("@/lib/square/client");

    // Channel-filtered hierarchy. The "40K Warhammer" top-level category is NOT
    // in ALLOWED_CATEGORY_IDS (only Miniatures + Hobby Supplies are), so it is
    // filtered out of `fetchAllCategories()`.
    vi.mocked(catalogApi.search).mockResolvedValue({
      objects: [
        {
          id: MINIATURES_ID,
          type: "CATEGORY" as const,
          categoryData: { name: "Miniatures", channels: ["TEST_CHANNEL"] },
        },
        {
          id: "GW",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Games Workshop",
            parentCategory: { id: MINIATURES_ID },
            channels: ["TEST_CHANNEL"],
          },
        },
        {
          id: "WH40K",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Warhammer 40K",
            parentCategory: { id: "GW" },
            channels: ["TEST_CHANNEL"],
          },
        },
      ],
    });

    // Step 1: slug search returns the item.
    vi.mocked(catalogApi.searchItems).mockResolvedValueOnce({
      items: [
        {
          type: "ITEM",
          id: "ITEM_ADE",
          itemData: {
            name: "Adepta Sororitas",
            // categories[0] is the INVALID "40K Warhammer" (excluded top-level);
            // a later category ("WH40K") is valid and resolves to Miniatures.
            categories: [
              { id: "40K_WARHAMMER_EXCLUDED" },
              { id: MINIATURES_ID },
              { id: "WH40K" },
            ],
          },
        },
      ],
    });

    // Step 3: batchGet returns full item detail.
    vi.mocked(catalogApi.batchGet).mockResolvedValue({
      objects: [
        {
          type: "ITEM",
          id: "ITEM_ADE",
          itemData: {
            name: "Adepta Sororitas",
            categories: [
              { id: "40K_WARHAMMER_EXCLUDED" },
              { id: MINIATURES_ID },
              { id: "WH40K" },
            ],
            variations: [
              {
                type: "ITEM_VARIATION",
                itemVariationData: {
                  priceMoney: { amount: 5000n, currency: "USD" },
                },
              },
            ],
          },
        },
      ] as never,
      relatedObjects: [] as never,
    });

    const { getProductDetailBySlug } = await import("@/lib/square/catalog");
    const product = await getProductDetailBySlug("adepta-sororitas");

    expect(product).not.toBeNull();
    // Must NOT resolve to "Uncategorized" even though categories[0] is invalid.
    // The deepest valid category (WH40K) is preferred, so the top-level is
    // "Miniatures" (allowlisted) and the full path is Miniatures → Games
    // Workshop → Warhammer 40K.
    expect(product!.category).toEqual({
      name: "Miniatures",
      slug: "miniatures",
    });
    expect(product!.subCategory).toEqual({
      name: "Warhammer 40K",
      slug: "warhammer-40k",
    });
    expect(product!.categoryPath).toEqual([
      { name: "Miniatures", slug: "miniatures" },
      { name: "Games Workshop", slug: "games-workshop" },
      { name: "Warhammer 40K", slug: "warhammer-40k" },
    ]);
  });
});
