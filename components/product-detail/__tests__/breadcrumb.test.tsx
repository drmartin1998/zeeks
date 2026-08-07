import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumb } from "@/components/product-detail/breadcrumb";

describe("Breadcrumb", () => {
  it("renders the full category path with the top-level link to the listing route", () => {
    render(
      <Breadcrumb
        categoryPath={[
          { name: "Miniatures", slug: "miniatures" },
          { name: "Games Workshop", slug: "games-workshop" },
          { name: "Warhammer 40K", slug: "warhammer-40k" },
        ]}
        productTitle="Adepta Sororitas"
      />
    );

    // Home is always the first segment.
    const home = screen.getByRole("link", { name: "Home" });
    expect(home).toHaveAttribute("href", "/");

    // The top-level category links to a valid listing route (no 404).
    const topLevel = screen.getByRole("link", { name: "Miniatures" });
    expect(topLevel).toHaveAttribute("href", "/categories/miniatures");

    // Intermediate subcategories link to the top-level page with a sub filter.
    const gw = screen.getByRole("link", { name: "Games Workshop" });
    expect(gw).toHaveAttribute(
      "href",
      "/categories/miniatures?sub=games-workshop"
    );
    const wh40k = screen.getByRole("link", { name: "Warhammer 40K" });
    expect(wh40k).toHaveAttribute(
      "href",
      "/categories/miniatures?sub=warhammer-40k"
    );

    // The product title is the final non-link segment.
    expect(screen.getByText("Adepta Sororitas")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Adepta Sororitas" })).toBeNull();
  });

  it("renders a single top-level category as a link and the product title", () => {
    render(
      <Breadcrumb
        categoryPath={[{ name: "Miniatures", slug: "miniatures" }]}
        productTitle="Space Marines"
      />
    );

    const topLevel = screen.getByRole("link", { name: "Miniatures" });
    expect(topLevel).toHaveAttribute("href", "/categories/miniatures");
    expect(screen.getByText("Space Marines")).toBeInTheDocument();
  });

  it("renders the uncategorized fallback as plain text (no 404 link)", () => {
    render(
      <Breadcrumb
        categoryPath={[{ name: "Uncategorized", slug: "uncategorized" }]}
        productTitle="Mystery Item"
      />
    );

    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
    // No link to /categories/uncategorized should exist.
    expect(
      screen.queryByRole("link", { name: "Uncategorized" })
    ).toBeNull();
  });
});