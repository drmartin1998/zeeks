import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSearch = vi.fn();
vi.mock("@/lib/square/client", () => ({
  catalogApi: { search: (...args: unknown[]) => mockSearch(...args) },
  locationId: "TEST_LOCATION",
}));

describe("getNavCategories error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return only STATIC_NAV_CATEGORIES when Square API fails", async () => {
    mockSearch.mockRejectedValue(new Error("Network Error"));

    const { getNavCategories } = await import("@/lib/data/categories");

    const categories = await getNavCategories();

    // STATIC_NAV_CATEGORIES are: About Us, Locations
    expect(categories).toEqual([
      { label: "About Us", href: "/about" },
      { label: "Locations", href: "/locations" },
    ]);

    // Verify no mock product categories (Miniatures, Board Games, etc.) are in the result
    const labels = categories.map((c) => c.label);
    expect(labels).not.toContain("Miniatures");
    expect(labels).not.toContain("Board Games");
    expect(labels).not.toContain("Card Games");
    expect(labels).not.toContain("Supplies");
  });

  it("should include Square categories + static links on success", async () => {
    mockSearch.mockResolvedValue({
      objects: [
        {
          id: "ZCZJWQX6WREDLATZFW3U7OCJ",
          type: "CATEGORY" as const,
          categoryData: { name: "Miniatures", channels: ["TEST_CHANNEL"] },
        },
      ],
    });

    const { getNavCategories } = await import("@/lib/data/categories");

    const categories = await getNavCategories();

    // Should have Square category + static links
    expect(categories).toContainEqual({
      label: "Miniatures",
      href: "/categories/miniatures",
    });
  });
});
