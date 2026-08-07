import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { HeroSection } from "@/components/hero-section";

describe("HeroSection", () => {
  const baseProps = {
    eyebrow: "Summer Sales Event",
    heading: "THE SUMMER OF STRATEGY",
    subheading: "Command your legion, build your empire, or master the arena.",
    imageUrl: "https://cdn.sanity.io/images/testproject/production/hero.png",
    primaryCta: { label: "Shop the Sale", href: "/categories/miniatures" },
    secondaryCta: { label: "View Featured", href: "/featured" },
  };

  it("should render eyebrow, heading, subheading, and both CTAs from props", () => {
    render(<HeroSection {...baseProps} />);

    expect(
      screen.getByText("Summer Sales Event"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "THE SUMMER OF STRATEGY" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Command your legion, build your empire, or master the arena."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Shop the Sale" }),
    ).toHaveAttribute("href", "/categories/miniatures");
    expect(
      screen.getByRole("link", { name: "View Featured" }),
    ).toHaveAttribute("href", "/featured");
  });

  it("should render the background image from the provided Sanity CDN URL", () => {
    const { container } = render(<HeroSection {...baseProps} />);

    const bg = container.querySelector("[style]");
    expect(bg?.getAttribute("style")).toContain(
      "https://cdn.sanity.io/images/testproject/production/hero.png",
    );
  });

  it("should render a neutral section with no broken image when heroBlock is missing", () => {
    render(<HeroSection eyebrow={null} heading={null} subheading={null} imageUrl={null} />);

    expect(
      screen.queryByRole("heading", { name: "THE SUMMER OF STRATEGY" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Shop the Sale" }),
    ).not.toBeInTheDocument();
  });

  it("should keep a neutral dark background when the image is missing", () => {
    const { container } = render(
      <HeroSection {...baseProps} imageUrl={null} />,
    );

    const bg = container.querySelector('[style*="backgroundImage"]');
    expect(bg).toBeNull();
  });

  it("should not render a dead button when a CTA has no label or href", () => {
    render(
      <HeroSection
        {...baseProps}
        primaryCta={{ label: "", href: "/broken" }}
        secondaryCta={{ label: "Side CTA", href: "" }}
      />,
    );

    expect(
      screen.queryByRole("link", { name: "" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Side CTA" }),
    ).not.toBeInTheDocument();
  });
});