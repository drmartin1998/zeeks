import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NavBar } from "@/components/nav-bar";
import type { NavCategory } from "@/lib/square/types";

const mockSquareCategories: NavCategory[] = [
  { label: "Board Games", href: "/categories/board-games" },
  { label: "Miniatures", href: "/categories/miniatures" },
  { label: "Card Games", href: "/categories/card-games" },
  { label: "Paints & Tools", href: "/categories/paints-tools" },
  { label: "About Us", href: "/about" },
  { label: "Locations", href: "/locations" },
  { label: "Sale", href: "/categories/sale", highlight: true },
];

describe("NavBar", () => {
  it("should render categories passed as prop", () => {
    const categories: NavCategory[] = [
      { label: "Board Games", href: "/categories/board-games" },
      { label: "Miniatures", href: "/categories/miniatures" },
    ];

    render(<NavBar categories={categories} />);

    expect(
      screen.getByRole("link", { name: "Board Games" })
    ).toHaveAttribute("href", "/categories/board-games");
    expect(
      screen.getByRole("link", { name: "Miniatures" })
    ).toHaveAttribute("href", "/categories/miniatures");
  });

  it("should fall back to hardcoded NAV_CATEGORIES when no prop given", () => {
    render(<NavBar />);

    // Verify fallback categories are rendered
    expect(
      screen.getByRole("link", { name: "Miniatures" })
    ).toHaveAttribute("href", "/categories/miniatures");
    expect(
      screen.getByRole("link", { name: "Board Games" })
    ).toHaveAttribute("href", "/categories/board-games");
  });

  it("should render About Us and Locations links", () => {
    render(<NavBar categories={mockSquareCategories} />);

    expect(
      screen.getByRole("link", { name: "About Us" })
    ).toHaveAttribute("href", "/about");
    expect(
      screen.getByRole("link", { name: "Locations" })
    ).toHaveAttribute("href", "/locations");
  });

  it("should render Sale link with highlight class", () => {
    render(<NavBar categories={mockSquareCategories} />);

    const saleLink = screen.getByRole("link", { name: "Sale" });
    expect(saleLink).toHaveAttribute("href", "/categories/sale");
    expect(saleLink.className).toContain("text-status-sale");
  });

  it("should render non-highlight categories with muted class", () => {
    const categories: NavCategory[] = [
      { label: "Board Games", href: "/categories/board-games" },
    ];

    render(<NavBar categories={categories} />);

    const link = screen.getByRole("link", { name: "Board Games" });
    expect(link.className).toContain("text-text-muted");
  });

  it("should render the Zeeks logo with a link to home", () => {
    render(<NavBar categories={[]} />);

    const logo = screen.getByAltText("Zeeks Logo");
    expect(logo).toBeInTheDocument();

    // The logo is wrapped in a link to "/"
    const homeLink = logo.closest("a");
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("should handle empty categories array gracefully", () => {
    render(<NavBar categories={[]} />);

    // When empty array, falls back to NAV_CATEGORIES
    expect(
      screen.getByRole("link", { name: "Miniatures" })
    ).toBeInTheDocument();
  });
});
