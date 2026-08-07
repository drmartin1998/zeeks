import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";

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

// Build a NextRequest for the route handler (defaults to the non-nested URL).
function mockRequest(url = "http://localhost:3000/api/catalog/categories") {
  return new NextRequest(url);
}

describe("GET /api/catalog/categories", () => {
  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should return categories from Square API", async () => {
    mockSearch.mockResolvedValueOnce({
      objects: [
        {
          id: "ZCZJWQX6WREDLATZFW3U7OCJ",
          type: "CATEGORY",
          categoryData: { channels: ["TEST_CHANNEL"], name: "Miniatures" },
        },
        {
          id: "62G7JSXJDS4U574NW4XS4WKV",
          type: "CATEGORY",
          categoryData: { channels: ["TEST_CHANNEL"], name: "Hobby Supplies" },
        },
      ],
    });

    const response = await GET(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual({
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

    const response = await GET(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it("should return 502 when Square API errors", async () => {
    mockSearch.mockRejectedValueOnce(new Error("Network Error"));

    const response = await GET(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data).toHaveProperty("error", "Network Error");
  });

  it("should exclude sub-categories that have a parentCategory", async () => {
    const MINIATURES_ID = "ZCZJWQX6WREDLATZFW3U7OCJ";
    mockSearch.mockResolvedValueOnce({
      objects: [
        {
          id: MINIATURES_ID,
          type: "CATEGORY",
          categoryData: { channels: ["TEST_CHANNEL"], name: "Miniatures" },
        },
        {
          id: "SUB1",
          type: "CATEGORY",
          categoryData: {
            name: "Warhammer 40K",
            channels: ["TEST_CHANNEL"],
            parentCategory: { id: MINIATURES_ID },
          },
        },
        {
          id: "62G7JSXJDS4U574NW4XS4WKV",
          type: "CATEGORY",
          categoryData: { channels: ["TEST_CHANNEL"], name: "Hobby Supplies" },
        },
        {
          id: "SUB2",
          type: "CATEGORY",
          categoryData: {
            name: "Paints",
            channels: ["TEST_CHANNEL"],
            parentCategory: { id: "62G7JSXJDS4U574NW4XS4WKV" },
          },
        },
      ],
    });

    const response = await GET(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    // Only allowlisted top-level categories (no parentCategory.id) should be returned
    expect(data).toHaveLength(1);
    expect(data.map((c: { label: string }) => c.label)).toEqual([
      "Miniatures",
    ]);
  });

  it("should filter out non-CATEGORY objects", async () => {
    mockSearch.mockResolvedValueOnce({
      objects: [
        {
          id: "ZCZJWQX6WREDLATZFW3U7OCJ",
          type: "CATEGORY",
          categoryData: { channels: ["TEST_CHANNEL"], name: "Miniatures" },
        },
        {
          id: "ITEM1",
          type: "ITEM",
          itemData: { name: "Space Marines" },
        },
        {
          id: "62G7JSXJDS4U574NW4XS4WKV",
          type: "CATEGORY",
          categoryData: { channels: ["TEST_CHANNEL"], name: "Hobby Supplies" },
        },
      ],
    });

    const response = await GET(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data.map((c: { label: string }) => c.label)).toEqual([
      "Miniatures",
    ]);
  });
});

describe("GET /api/catalog/categories?nested=true", () => {
  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should return a hierarchical tree with nested subcategories", async () => {
    const MINIATURES_ID = "ZCZJWQX6WREDLATZFW3U7OCJ";
    const GW_ID = "GW1";
    mockSearch.mockResolvedValueOnce({
      objects: [
        {
          id: MINIATURES_ID,
          type: "CATEGORY",
          categoryData: { channels: ["TEST_CHANNEL"], name: "Miniatures" },
        },
        {
          id: GW_ID,
          type: "CATEGORY",
          categoryData: {
            name: "Games Workshop",
            channels: ["TEST_CHANNEL"],
            parentCategory: { id: MINIATURES_ID },
          },
        },
        {
          id: "W40K",
          type: "CATEGORY",
          categoryData: {
            name: "Warhammer 40K",
            channels: ["TEST_CHANNEL"],
            parentCategory: { id: GW_ID },
          },
        },
      ],
    });

    const response = await GET(
      mockRequest("http://localhost:3000/api/catalog/categories?nested=true")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("tree");
    expect(Array.isArray(data.tree)).toBe(true);
    expect(data.tree).toHaveLength(1);
    expect(data.tree[0]).toMatchObject({
      label: "Miniatures",
      href: "/categories/miniatures",
      hasChildren: true,
    });
    // Two-level nesting: Games Workshop (level-2) → Warhammer 40K (level-3)
    expect(data.tree[0].children[0]).toMatchObject({
      label: "Games Workshop",
      href: "/categories/miniatures?sub=games-workshop",
      hasChildren: true,
      children: [
        {
          label: "Warhammer 40K",
          href: "/categories/miniatures?sub=warhammer-40k",
          hasChildren: false,
          children: [],
        },
      ],
    });
  });

  it("should return an empty tree array when catalog is empty", async () => {
    mockSearch.mockResolvedValueOnce({ objects: [] });

    const response = await GET(
      mockRequest("http://localhost:3000/api/catalog/categories?nested=true")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ tree: [] });
  });
});
