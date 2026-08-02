import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PointsCard } from "@/components/account/points-card";

describe("PointsCard", () => {
  it("should display loyalty balance when points are available", () => {
    render(<PointsCard balance={500} error={null} />);

    expect(screen.getByText("Reward Points")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
  });

  it("should display formatted large balance", () => {
    render(<PointsCard balance={12500} error={null} />);

    expect(screen.getByText("12,500")).toBeInTheDocument();
  });

  it("should display zero balance", () => {
    render(<PointsCard balance={0} error={null} />);

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("should display error state when error is provided", () => {
    render(<PointsCard balance={null} error="Loyalty API down" />);

    expect(screen.getByText("Points unavailable")).toBeInTheDocument();
    expect(screen.queryByText("500")).not.toBeInTheDocument();
  });

  it("should display empty state when balance is null and no error", () => {
    render(<PointsCard balance={null} error={null} />);

    expect(
      screen.getByText(/No points yet/),
    ).toBeInTheDocument();
  });

  it("should render as a Card component", () => {
    render(<PointsCard balance={100} error={null} />);

    const card = screen.getByText("Reward Points").closest("[data-slot='card']");
    expect(card).toBeInTheDocument();
  });
});
