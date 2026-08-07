import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// Mock the Square client module to control API responses (mock at the SDK
// boundary, not the network).
const mockSearchItems = vi.fn();

vi.mock("@/lib/square/client", () => ({
  catalogApi: {
    searchItems: (...args: unknown[]) => mockSearchItems(...args),
  },
  locationId: "LSQW9H0ZPD7ZA",
}));

// Dynamic import so the mock takes effect before the route module loads
const { GET } = await import("../route");

function makeItem(id: string, name: string) {
  return {
    id,
    type: "ITEM",
    itemData: {
      name,
      categories: [{ id: "CAT_1" }],
      variations: [
        {
          type: "ITEM_VARIATION",
          itemVariationData: {
            priceMoney: { amount: 1000n, currency: "USD" },
          },
        },
      ],
    },
  };
}

describe("GET /api/catalog/products/search", () => {
  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should return capped products with a full totalCount when limit is provided", async () => {
    mockSearchItems.mockResolvedValueOnce({
      items: [
        makeItem("1", "Warhammer Starter"),
        makeItem("2", "Warhammer Paint"),
        makeItem("3", "Warhammer Book"),
        makeItem("4", "Warhammer Dice"),
        makeItem("5", "Warhammer Mat"),
        makeItem("6", "Warhammer Brush"),
        makeItem("7", "Warhammer Kit"),
        makeItem("8", "Warhammer Glue"),
      ],
      cursor: undefined,
    });

    const request = new Request(
      "http://localhost:3000/api/catalog/products/search?q=warhammer&limit=5"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Capped to 5 suggestions
    expect(data.products).toHaveLength(5);
    // Total count reflects the full match set
    expect(data.totalCount).toBe(8);
    // The route was called with the textFilter
    expect(mockSearchItems).toHaveBeenCalledWith(
      expect.objectContaining({ textFilter: "warhammer", limit: 100 })
    );
  });

  it("should return all products and totalCount when no limit is provided", async () => {
    mockSearchItems.mockResolvedValueOnce({
      items: [makeItem("1", "Paint Set"), makeItem("2", "Paint Pot")],
      cursor: undefined,
    });

    const request = new Request(
      "http://localhost:3000/api/catalog/products/search?q=paint"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.products).toHaveLength(2);
    expect(data.totalCount).toBe(2);
  });

  it("should return 400 for a missing query", async () => {
    const request = new Request(
      "http://localhost:3000/api/catalog/products/search"
    );
    const response = await GET(request);
    expect(response.status).toBe(400);
  });
});