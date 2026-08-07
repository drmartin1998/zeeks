import { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FacetOptionValue } from "@/components/product-listing/facet-group";
import type { CategoryTreeNode } from "@/lib/square/catalog";
import { FilterBar } from "@/components/product-listing/filter-bar";

function makeOptions(names: string[]): FacetOptionValue[] {
  return names.map((n) => ({ value: n, label: n }));
}

function renderBar(overrides: Partial<Parameters<typeof FilterBar>[0]> = {}) {
  const props: Parameters<typeof FilterBar>[0] = {
    totalResults: 10,
    showingStart: 1,
    showingEnd: 10,
    activeCount: 0,
    currentSort: "Featured",
    onSortChange: vi.fn(),
    activeSubs: [],
    activeBrands: [],
    activeAvailability: [],
    subOptions: makeOptions(["Paints", "Models"]),
    brandOptions: makeOptions(["Citadel", "Games Workshop"]),
    availabilityOptions: [
      { value: "IN_STOCK", label: "In Stock" },
      { value: "OUT_OF_STOCK", label: "Out of Stock" },
    ],
    onToggleSub: vi.fn(),
    onToggleBrand: vi.fn(),
    onToggleAvailability: vi.fn(),
    onClearAll: vi.fn(),
    ...overrides,
  };
  return props;
}

describe("FilterBar responsive layouts", () => {
  it("should render the facet groups (Categories, Brand, Availability)", () => {
    render(<FilterBar {...renderBar()} />);
    expect(screen.getAllByText("Categories").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Brand").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Availability").length).toBeGreaterThan(0);
  });

  it("should render the product result count", () => {
    render(<FilterBar {...renderBar()} />);
    expect(screen.getByText(/Showing 1–10 of 10 results/)).toBeInTheDocument();
  });
});

describe("FilterBar active-filter count and clear-all", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show the active count and clear-all button when filters are active", async () => {
    const user = userEvent.setup();
    const onClearAll = vi.fn();
    render(<FilterBar {...renderBar({ activeCount: 3, onClearAll })} />);

    // Mobile toggle shows "Active: 3"
    const toggle = screen.getByRole("button", { name: /filter & categories/i });
    await user.click(toggle);

    expect(screen.getByText("Active: 3")).toBeInTheDocument();

    // Clear all button present and calls handler
    const clearButtons = screen.getAllByRole("button", { name: /clear all/i });
    expect(clearButtons.length).toBeGreaterThan(0);
    await user.click(clearButtons[0]);
    expect(onClearAll).toHaveBeenCalled();
  });

  it("should not show clear-all when no filters are active", () => {
    render(<FilterBar {...renderBar({ activeCount: 0 })} />);
    expect(screen.queryByRole("button", { name: /clear all/i })).not.toBeInTheDocument();
  });
});

describe("FilterBar subcategory drill-down (md strip / sm toggle)", () => {
  it("should reveal child subcategories when a parent is selected (hierarchical)", async () => {
    const user = userEvent.setup();

    const tree: CategoryTreeNode[] = [
      {
        id: "GW",
        name: "Games Workshop",
        slug: "games-workshop",
        children: [
          { id: "SM", name: "Warhammer 40K", slug: "warhammer-40k", children: [] },
          { id: "AOS", name: "Lord of the Rings MESBG", slug: "lotr-mesbg", children: [] },
        ],
      },
      { id: "PAINT", name: "Paints", slug: "paints", children: [] },
    ];

    // Stateful wrapper so clicking a checkbox actually toggles the selection,
    // which is what drives the hierarchical reveal in SubcategoryFacet.
    function Harness() {
      const [activeSubs, setActiveSubs] = useState<string[]>([]);
      const toggleSub = (slug: string) =>
        setActiveSubs((prev) =>
          prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
        );
      return (
        <FilterBar
          {...renderBar({
            activeSubs,
            onToggleSub: toggleSub,
            subNodes: tree,
            subCounts: { "games-workshop": 3, "warhammer-40k": 2, "lotr-mesbg": 1, paints: 2 },
          })}
        />
      );
    }

    render(<Harness />);

    // Only top-level subcategories are visible initially.
    expect(screen.getAllByRole("checkbox", { name: /games workshop/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("checkbox", { name: /warhammer 40k/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /lord of the rings mesbg/i })).not.toBeInTheDocument();

    // Select the parent in the (shared) hierarchical facet → children revealed.
    // The subcategory "Games Workshop" checkbox lives under the "Categories"
    // heading (the Brand group has a separate "Games Workshop" option, so we
    // scope the query to the subcategory facet to disambiguate).
    const gwCheckbox = screen
      .getAllByRole("checkbox", { name: /games workshop/i })
      .find((el) => {
        let node: Element | null = el;
        while (node) {
          const h3 = Array.from(node.querySelectorAll(":scope > h3"));
          if (h3.some((h) => h.textContent === "Categories")) return true;
          node = node.parentElement;
        }
        return false;
      })!;
    await user.click(gwCheckbox);

    expect(screen.getAllByRole("checkbox", { name: /warhammer 40k/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("checkbox", { name: /lord of the rings mesbg/i }).length).toBeGreaterThan(0);
  });
});