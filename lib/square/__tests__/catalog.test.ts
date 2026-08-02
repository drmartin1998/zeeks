import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the catalog API for both search (categories) and searchItems (products)
vi.mock("@/lib/square/client", () => ({
  catalogApi: {
    search: vi.fn().mockResolvedValue({}),
    searchItems: vi.fn().mockResolvedValue({}),
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
