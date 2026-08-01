import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the catalog API
const mockSearchItems = vi.fn();
vi.mock("@/lib/square/client", () => ({
  catalogApi: { searchItems: (...args: unknown[]) => mockSearchItems(...args), search: vi.fn().mockResolvedValue({}) },
  locationId: "TEST_LOCATION",
}));

describe("getSquareProductsByCategorySlug pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should accumulate items across multiple cursor pages", async () => {
    const { getSquareProductsByCategorySlug } = await import(
      "@/lib/square/catalog"
    );

    // Mock fetchAllCategories: one parent + one subcategory
    const mockSearch = vi.fn().mockResolvedValue({
      objects: [
        {
          id: "PARENT1",
          type: "CATEGORY" as const,
          categoryData: { name: "Board Games" },
        },
        {
          id: "SUB1",
          type: "CATEGORY" as const,
          categoryData: {
            name: "Strategy",
            parentCategoryId: "PARENT1",
          },
        },
      ],
    });

    vi.mocked((await import("@/lib/square/client")).catalogApi.search).mockImplementation(mockSearch);

    // Mock searchItems: page 1 with cursor, page 2 without cursor
    mockSearchItems
      .mockResolvedValueOnce({
        items: [
          {
            type: "ITEM",
            id: "ITEM1",
            itemData: { name: "Catan", variations: [] },
          },
          {
            type: "ITEM",
            id: "ITEM2",
            itemData: { name: "Pandemic", variations: [] },
          },
        ],
        cursor: "page2cursor",
      })
      .mockResolvedValueOnce({
        items: [
          {
            type: "ITEM",
            id: "ITEM3",
            itemData: { name: "Wingspan", variations: [] },
          },
        ],
      });

    const products = await getSquareProductsByCategorySlug("board-games");

    expect(products).not.toBeNull();
    expect(products!.length).toBe(3);
    expect(products!.map((p) => p.title)).toEqual([
      "Catan",
      "Pandemic",
      "Wingspan",
    ]);
    // Verify searchItems was called twice (page 1 + cursor, page 2 no cursor)
    expect(mockSearchItems).toHaveBeenCalledTimes(2);
  });

  it("should return null when Square API fails", async () => {
    const mockSearch = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.mocked((await import("@/lib/square/client")).catalogApi.search).mockImplementation(mockSearch);

    const { getSquareProductsByCategorySlug } = await import(
      "@/lib/square/catalog"
    );

    const products = await getSquareProductsByCategorySlug("board-games");
    expect(products).toBeNull();
  });
});
