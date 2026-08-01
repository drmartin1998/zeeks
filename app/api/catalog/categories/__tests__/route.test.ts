import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// Mock the Square client module to control API responses.
// This is the correct boundary — we mock at the Square SDK, not the network,
// because the SDK's internal HTTP transport is opaque to MSW in this setup.
const mockSearch = vi.fn();

vi.mock("@/lib/square/client", () => ({
  catalogApi: {
    search: (...args: unknown[]) => mockSearch(...args),
  },
  locationId: "LSQW9H0ZPD7ZA",
}));

// Dynamic import so the mock takes effect before the route module loads
const { GET } = await import("../route");

describe("GET /api/catalog/categories", () => {
  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should return categories from Square API", async () => {
    mockSearch.mockResolvedValueOnce({
      objects: [
        {
          id: "CAT1",
          type: "CATEGORY",
          categoryData: { name: "Board Games" },
        },
        {
          id: "CAT2",
          type: "CATEGORY",
          categoryData: { name: "Miniatures" },
        },
      ],
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({
      label: "Board Games",
      href: "/categories/board-games",
    });
    expect(data[1]).toEqual({
      label: "Miniatures",
      href: "/categories/miniatures",
    });

    // Verify cache headers
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
  });

  it("should handle empty Square catalog", async () => {
    mockSearch.mockResolvedValueOnce({
      objects: [],
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it("should return 502 when Square API errors", async () => {
    mockSearch.mockRejectedValueOnce(new Error("Network Error"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data).toHaveProperty("error", "Network Error");
  });

  it("should exclude sub-categories that have a parentCategoryId", async () => {
    mockSearch.mockResolvedValueOnce({
      objects: [
        {
          id: "CAT1",
          type: "CATEGORY",
          categoryData: { name: "Board Games" },
        },
        {
          id: "CAT2",
          type: "CATEGORY",
          categoryData: {
            name: "Strategy Games",
            parentCategoryId: "CAT1",
          },
        },
        {
          id: "CAT3",
          type: "CATEGORY",
          categoryData: { name: "Miniatures" },
        },
        {
          id: "CAT4",
          type: "CATEGORY",
          categoryData: {
            name: "Warhammer 40K",
            parentCategoryId: "CAT3",
          },
        },
      ],
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    // Only top-level categories (no parentCategoryId) should be returned
    expect(data).toHaveLength(2);
    expect(data.map((c: { label: string }) => c.label)).toEqual([
      "Board Games",
      "Miniatures",
    ]);
  });

  it("should filter out non-CATEGORY objects", async () => {
    mockSearch.mockResolvedValueOnce({
      objects: [
        {
          id: "CAT1",
          type: "CATEGORY",
          categoryData: { name: "Board Games" },
        },
        {
          id: "ITEM1",
          type: "ITEM",
          itemData: { name: "Catan" },
        },
        {
          id: "CAT2",
          type: "CATEGORY",
          categoryData: { name: "Miniatures" },
        },
      ],
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data.map((c: { label: string }) => c.label)).toEqual([
      "Board Games",
      "Miniatures",
    ]);
  });
});
