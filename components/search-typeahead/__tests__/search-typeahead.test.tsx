import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock global fetch for the search route
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { SearchTypeahead } from "@/components/search-typeahead/search-typeahead";

function mockSearchResponse(products: unknown[], totalCount: number) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ products, totalCount }),
  });
}

const product = (id: string, title: string, price: number) => ({
  id,
  title,
  price,
  image: null,
});

describe("SearchTypeahead suggestions while typing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockReset();
  });

  it("should fetch suggestions after a debounce pause (not per keystroke)", async () => {
    const user = userEvent.setup();
    mockSearchResponse([product("1", "Warhammer 40K", 49.99)], 1);

    render(<SearchTypeahead />);

    const input = screen.getByRole("combobox");
    // Type multiple keystrokes quickly — only one debounced request should fire.
    await user.type(input, "war");

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/catalog/products/search");
    expect(url).toContain("q=war");
    expect(url).toContain("limit=5");

    // Suggestions render
    await waitFor(() => {
      expect(screen.getByText("Warhammer 40K")).toBeInTheDocument();
    });
  });

  it("should update suggestions as the query changes", async () => {
    const user = userEvent.setup();
    mockSearchResponse([product("1", "Warhammer 40K", 49.99)], 1);
    mockSearchResponse([product("2", "Warhammer Paint Set", 24.5)], 1);

    render(<SearchTypeahead />);

    const input = screen.getByRole("combobox");
    await user.type(input, "war");
    await waitFor(() => {
      expect(screen.getByText("Warhammer 40K")).toBeInTheDocument();
    });

    await user.type(input, "hammer");
    await waitFor(() => {
      expect(screen.getByText("Warhammer Paint Set")).toBeInTheDocument();
    });
  });

  it("should not open a dropdown for a whitespace-only query", async () => {
    const user = userEvent.setup();
    render(<SearchTypeahead />);

    const input = screen.getByRole("combobox");
    await user.type(input, "   ");

    // No fetch fired
    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

describe("SearchTypeahead results count and view all", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockReset();
  });

  it("should show the results count in the header", async () => {
    const user = userEvent.setup();
    mockSearchResponse(
      [
        product("1", "Warhammer 40K", 49.99),
        product("2", "Warhammer Paint", 24.5),
      ],
      8
    );

    render(<SearchTypeahead />);
    await user.type(screen.getByRole("combobox"), "war");

    await waitFor(() => {
      expect(screen.getByText("(8 results)")).toBeInTheDocument();
    });
  });

  it("should navigate to the search page via View all results", async () => {
    const user = userEvent.setup();
    mockSearchResponse([product("1", "Warhammer 40K", 49.99)], 1);

    render(<SearchTypeahead />);
    await user.type(screen.getByRole("combobox"), "war");

    await waitFor(() => {
      expect(screen.getByText(/View all 1 results for "war"/)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/View all 1 results/));
    expect(mockPush).toHaveBeenCalledWith("/search?q=war");
  });
});

describe("SearchTypeahead clear and empty state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockReset();
  });

  it("should clear the query and close the dropdown via the clear control", async () => {
    const user = userEvent.setup();
    mockSearchResponse([product("1", "Warhammer 40K", 49.99)], 1);

    render(<SearchTypeahead />);
    const input = screen.getByRole("combobox");
    await user.type(input, "war");
    await waitFor(() => {
      expect(screen.getByText("Warhammer 40K")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /clear search/i }));

    expect((input as HTMLInputElement).value).toBe("");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("should show the empty state for a query with no matches", async () => {
    const user = userEvent.setup();
    mockSearchResponse([], 0);

    render(<SearchTypeahead />);
    await user.type(screen.getByRole("combobox"), "zzz");

    await waitFor(() => {
      expect(
        screen.getByText(/No products found for "zzz"/)
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Try searching for/)).toBeInTheDocument();
  });
});