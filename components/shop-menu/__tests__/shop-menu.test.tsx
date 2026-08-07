import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/navigation for usePathname
const mockPathname = vi.fn(() => "/");
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => mockPathname(),
}));

// Mock Clerk for the nav auth UI
import { setClerkMockConfig } from "@/components/__tests__/__mocks__/clerk";
vi.mock("@clerk/nextjs", async () => {
  const actual = await vi.importActual<
    typeof import("@/components/__tests__/__mocks__/clerk")
  >("@/components/__tests__/__mocks__/clerk");
  return actual;
});

import { NavBar } from "@/components/nav-bar";
import type { CategoryTree, NavCategory } from "@/lib/square/types";

const mockTree: CategoryTree = {
  source: "square",
  root: [
    {
      label: "Miniatures",
      href: "/categories/miniatures",
      hasChildren: true,
      children: [
        {
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
        },
      ],
    },
    {
      label: "Board Games",
      href: "/categories/board-games",
      hasChildren: false,
      children: [],
    },
  ],
};

const staticCategories: NavCategory[] = [
  { label: "About Us", href: "/about" },
  { label: "Local Events", href: "/events" },
];

describe("ShopMenu — Desktop (US1)", () => {
  beforeEach(() => {
    setClerkMockConfig({ signedIn: false });
    mockPathname.mockReturnValue("/");
    // Force desktop viewport by stubbing matchMedia to min-width 1024px match.
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("1024px"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it("should replace flat catalog links with a Shop item that opens the megamenu", () => {
    render(
      <NavBar categories={staticCategories} categoryTree={mockTree} />
    );

    // Shop button present; catalog categories NOT in the row (replaced).
    const shop = screen.getByRole("button", { name: /shop/i });
    expect(shop).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Miniatures" })).toBeNull();
    // Static links remain.
    expect(screen.getByRole("link", { name: "About Us" })).toBeInTheDocument();

    // Click to open the megamenu.
    fireEvent.click(shop);
    expect(screen.getByRole("link", { name: "Miniatures" })).toBeInTheDocument();
  });

  it("should show level-2 children indented under the parent subcategory", () => {
    render(
      <NavBar categories={staticCategories} categoryTree={mockTree} />
    );
    fireEvent.click(screen.getByRole("button", { name: /shop/i }));

    expect(screen.getByRole("link", { name: "Games Workshop" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Warhammer 40K" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Shop All Miniatures" })).toBeInTheDocument();
  });

  it("should navigate subcategory links using the ?sub= query scheme", () => {
    render(
      <NavBar categories={staticCategories} categoryTree={mockTree} />
    );
    fireEvent.click(screen.getByRole("button", { name: /shop/i }));

    expect(
      screen.getByRole("link", { name: "Games Workshop" })
    ).toHaveAttribute(
      "href",
      "/categories/miniatures?sub=games-workshop"
    );
  });

  it("should close the megamenu when the pointer leaves the menu area", () => {
    vi.useFakeTimers();
    render(
      <NavBar categories={staticCategories} categoryTree={mockTree} />
    );
    fireEvent.click(screen.getByRole("button", { name: /shop/i }));
    expect(screen.getByRole("link", { name: "Miniatures" })).toBeInTheDocument();

    // Leave the Shop button (schedules the delayed close).
    const shopBtn = screen.getByRole("button", { name: /shop/i });
    fireEvent.mouseLeave(shopBtn);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByRole("link", { name: "Miniatures" })).toBeNull();
    vi.useRealTimers();
  });

  it("should close the megamenu when mousing off to a sibling nav link", () => {
    vi.useFakeTimers();
    render(
      <NavBar categories={staticCategories} categoryTree={mockTree} />
    );
    fireEvent.click(screen.getByRole("button", { name: /shop/i }));
    expect(screen.getByRole("link", { name: "Miniatures" })).toBeInTheDocument();

    // Move the pointer from the Shop button onto the "Home" link (left).
    const shopBtn = screen.getByRole("button", { name: /shop/i });
    fireEvent.mouseLeave(shopBtn);
    fireEvent.mouseEnter(screen.getByRole("link", { name: "Home" }));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByRole("link", { name: "Miniatures" })).toBeNull();
    vi.useRealTimers();
  });

  it("should close the megamenu when clicking the backdrop", () => {
    render(
      <NavBar categories={staticCategories} categoryTree={mockTree} />
    );
    fireEvent.click(screen.getByRole("button", { name: /shop/i }));
    expect(screen.getByRole("link", { name: "Miniatures" })).toBeInTheDocument();

    // The click-away backdrop covers the page below the nav.
    const backdrop = document.querySelector('[data-slot="shop-backdrop"]');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(screen.queryByRole("link", { name: "Miniatures" })).toBeNull();
  });

  it("should close the megamenu when clicking outside the menu", () => {
    render(
      <NavBar categories={staticCategories} categoryTree={mockTree} />
    );
    fireEvent.click(screen.getByRole("button", { name: /shop/i }));
    expect(screen.getByRole("link", { name: "Miniatures" })).toBeInTheDocument();

    // Simulate a pointerdown on a page element outside the Shop region.
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("link", { name: "Miniatures" })).toBeNull();
  });

  it("should not render the Shop menu when the tree is empty", () => {
    render(
      <NavBar
        categories={staticCategories}
        categoryTree={{ root: [], source: "empty" }}
      />
    );
    expect(screen.queryByRole("button", { name: /shop/i })).toBeNull();
  });
});

describe("ShopMenu — Mobile drilldown (US2)", () => {
  beforeEach(() => {
    setClerkMockConfig({ signedIn: false });
    mockPathname.mockReturnValue("/");
    // Force mobile viewport: min-width 1024px does NOT match.
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: !query.includes("1024px"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it("should open a full-screen drawer listing top-level categories", () => {
    render(
      <NavBar categories={staticCategories} categoryTree={mockTree} />
    );
    fireEvent.click(screen.getByRole("button", { name: /shop/i }));

    expect(screen.getByRole("dialog", { name: "Shop menu" })).toBeInTheDocument();
    expect(screen.getByText("Miniatures")).toBeInTheDocument();
    expect(screen.getByText("Board Games")).toBeInTheDocument();
  });

  it("should drill down to level-2 subcategories and then level-3 leaves", () => {
    render(
      <NavBar categories={staticCategories} categoryTree={mockTree} />
    );
    fireEvent.click(screen.getByRole("button", { name: /shop/i }));

    // Level 1 → tap Miniatures (has children) → level 2
    fireEvent.click(screen.getByText("Miniatures"));
    expect(screen.getByText("Games Workshop")).toBeInTheDocument();

    // Level 2 → tap Games Workshop (has children) → level 3
    fireEvent.click(screen.getByText("Games Workshop"));
    expect(screen.getByText("Warhammer 40K")).toBeInTheDocument();
  });

  it("should navigate directly for a leaf category and close the drawer", () => {
    render(
      <NavBar categories={staticCategories} categoryTree={mockTree} />
    );
    fireEvent.click(screen.getByRole("button", { name: /shop/i }));

    // Board Games is a leaf → renders as a link.
    const leaf = screen.getByRole("link", { name: "Board Games" });
    expect(leaf).toHaveAttribute("href", "/categories/board-games");
    fireEvent.click(leaf);
    expect(screen.queryByRole("dialog", { name: "Shop menu" })).toBeNull();
  });

  it("should return to the previous level via the back control", () => {
    render(
      <NavBar categories={staticCategories} categoryTree={mockTree} />
    );
    fireEvent.click(screen.getByRole("button", { name: /shop/i }));
    fireEvent.click(screen.getByText("Miniatures"));
    expect(screen.getByText("Games Workshop")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Board Games")).toBeInTheDocument();
  });
});