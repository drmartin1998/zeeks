import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/footer", () => ({
  Footer: () => <footer data-testid="mock-footer" />,
}));

const mockGetVipPlans = vi.fn();
vi.mock("@/lib/square/subscriptions", () => ({
  getVipSubscriptionPlans: () => mockGetVipPlans(),
}));

import VipProgramPage from "../page";

describe("VipProgramPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the hero, tier comparison, VIP Weekends, and FAQ sections (US4)", async () => {
    mockGetVipPlans.mockResolvedValue([
      {
        id: "plan-basic",
        name: "VIP Basic",
        priceCents: 2500,
        billingCadence: "per year",
        description: "Basic description",
        benefits: ["15% OFF Purchases"],
        purchaseActionLabel: "Join VIP Basic",
      },
      {
        id: "plan-premium",
        name: "VIP Premium",
        priceCents: 9900,
        billingCadence: "per year",
        description: "Premium description",
        benefits: ["20% OFF Purchases"],
        purchaseActionLabel: "Go Premium",
      },
    ]);

    render(await VipProgramPage());

    // Hero
    expect(
      screen.getByRole("heading", { name: "Join the Zeeks VIP Program" })
    ).toBeInTheDocument();

    // Section title
    expect(
      screen.getByRole("heading", { name: "Choose Your Membership" })
    ).toBeInTheDocument();

    // Tiers (US2)
    expect(screen.getByText("VIP Basic")).toBeInTheDocument();
    expect(screen.getByText("$25 per year")).toBeInTheDocument();
    expect(screen.getByText("VIP Premium")).toBeInTheDocument();
    expect(screen.getByText("$99 per year")).toBeInTheDocument();

    // VIP Weekends
    expect(
      screen.getByRole("heading", { name: "VIP Weekends" })
    ).toBeInTheDocument();

    // FAQ
    expect(
      screen.getByRole("heading", { name: /Got Questions\?/i })
    ).toBeInTheDocument();
  });

  it("handles graceful empty state when Square returns no plans (US2 Edge Case)", async () => {
    mockGetVipPlans.mockResolvedValue([]);

    render(await VipProgramPage());

    expect(
      screen.getByText("Membership options are unavailable right now.")
    ).toBeInTheDocument();
  });
});