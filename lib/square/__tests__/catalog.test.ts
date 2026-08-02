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
          categoryData: { name: "Miniatures" },
        },
        {
          id: "SUB1",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Warhammer 40K",
            parentCategoryId: MINIATURES_ID,
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
          categoryData: { name: "Board Games" },
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
          categoryData: { name: "Miniatures" },
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
});
