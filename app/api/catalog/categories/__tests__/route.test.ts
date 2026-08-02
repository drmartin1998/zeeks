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

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({
      label: "Miniatures",
      href: "/categories/miniatures",
    });
    expect(data[1]).toEqual({
      label: "Hobby Supplies",
      href: "/categories/hobby-supplies",
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

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    // Only top-level categories (no parentCategory.id) should be returned
    expect(data).toHaveLength(2);
    expect(data.map((c: { label: string }) => c.label)).toEqual([
      "Miniatures",
      "Hobby Supplies",
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

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data.map((c: { label: string }) => c.label)).toEqual([
      "Miniatures",
      "Hobby Supplies",
    ]);
  });
});
