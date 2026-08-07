import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryProductGrid } from "@/components/category-product-grid";
import type { SquareProduct, SquareSubCategory } from "@/lib/square/catalog";

// Mock next/navigation
const mockPush = vi.fn();
const mutableParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => mutableParams,
  useRouter: () => ({ push: mockPush }),
}));

// Match media for responsive grid
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

const mockSubCategories: SquareSubCategory[] = [
  { id: "SUB1", name: "Strategy", slug: "strategy" },
  { id: "SUB2", name: "Family", slug: "family" },
];

function createProducts(count: number, subSlug?: string): SquareProduct[] {
  return Array.from({ length: count }, (_, i) => ({
    title: `Product ${i + 1}`,
    category: "Board Games",
    categorySlug: "board-games",
    subCategory: subSlug ?? undefined,
    subCategorySlug: subSlug ?? undefined,
    price: 10 + i,
    image: "",
    gradient: "from-zeeks-purple to-zeeks-purple-dark",
    availability: "IN_STOCK",
  }));
}

describe("CategoryProductGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutableParams.delete("sub");
  });

  // T013: Pagination
  it("should paginate products 12 per page", async () => {
    const user = userEvent.setup();
    const products = createProducts(20);

    render(
      <CategoryProductGrid
        products={products}
        subCategories={mockSubCategories}
      />
    );

    // Page 1: 12 products shown
    expect(screen.getAllByText(/Product \d+/)).toHaveLength(12);
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 12")).toBeInTheDocument();

    // Pagination controls visible
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();

    // Navigate to page 2
    await user.click(screen.getByRole("button", { name: "Page 2" }));

    // Page 2: 8 products shown
    expect(screen.getAllByText(/Product \d+/)).toHaveLength(8);
    expect(screen.getByText("Product 13")).toBeInTheDocument();
    expect(screen.getByText("Product 20")).toBeInTheDocument();
  });

  it("should not show pagination when 12 or fewer products", () => {
    const products = createProducts(12);

    render(
      <CategoryProductGrid
        products={products}
        subCategories={mockSubCategories}
      />
    );

    expect(screen.queryByRole("navigation", { name: "Pagination" })).toBeNull();
  });

  // T018: URL persistence (can verify push is called with correct URL)
  it("should update URL when subcategory chip is clicked", async () => {
    const products = [
      ...createProducts(3, "strategy"),
      ...createProducts(2, "family"),
    ];

    render(
      <CategoryProductGrid
        products={products}
        subCategories={mockSubCategories}
      />
    );

    // Click "Strategy" chip
    const strategyBtn = screen.getByRole("button", { name: "Strategy" });
    await userEvent.click(strategyBtn);

    // URL should be pushed with ?sub=strategy
    expect(mockPush).toHaveBeenCalledWith("?sub=strategy", { scroll: false });

    // Only Strategy products shown
    expect(screen.getAllByText(/Product \d+/)).toHaveLength(3);
  });

  // T019: Zero-results state
  it("should show contextual empty state when filter yields zero results", async () => {
    const products = createProducts(5, "family");
    const user = userEvent.setup();

    render(
      <CategoryProductGrid
        products={products}
        subCategories={mockSubCategories}
      />
    );

    // Initially all products shown (no filter)
    expect(screen.getAllByText(/Product \d+/)).toHaveLength(5);

    // Click "Strategy" chip (which has 0 products)
    await user.click(screen.getByRole("button", { name: "Strategy" }));

    // After clicking Strategy with 0 products, should show contextual empty state
    expect(
      screen.getByText("No products in this subcategory")
    ).toBeInTheDocument();
    expect(screen.getByText("Show all")).toBeInTheDocument();
  });

  // Bug fix: navigating to a different ?sub= via the Shop megamenu (a query-only
  // change on the same path) must update the filtered state, not just the URL.
  it("should update the active filter when the URL sub param changes", async () => {
    const products = [
      ...createProducts(3, "strategy"),
      ...createProducts(2, "family"),
    ];

    const { rerender } = render(
      <CategoryProductGrid
        products={products}
        subCategories={mockSubCategories}
      />
    );

    // Initially all 5 products shown
    expect(screen.getAllByText(/Product \d+/)).toHaveLength(5);

    // Simulate navigation to ?sub=strategy (as the megamenu Link would do),
    // then re-render so the effect re-reads the updated search params.
    mutableParams.set("sub", "strategy");
    rerender(
      <CategoryProductGrid
        products={products}
        subCategories={mockSubCategories}
      />
    );

    // Only Strategy products shown after the URL change.
    expect(screen.getAllByText(/Product \d+/)).toHaveLength(3);
  });
});
