import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TierComparison } from "../tier-comparison";
import type { VipSubscriptionPlan } from "@/lib/square/types";

const mockPlans: VipSubscriptionPlan[] = [
  {
    id: "plan-basic-123",
    name: "VIP Basic",
    priceCents: 2500,
    billingCadence: "per year",
    description:
      "Perfect for casual players looking to stock up on their personal library.",
    benefits: [
      "15% OFF Purchases at the Counter",
      "20% OFF Most Pre-Orders",
      "Access to VIP Weekends",
    ],
    purchaseActionLabel: "Join VIP Basic",
  },
  {
    id: "plan-premium-456",
    name: "VIP Premium",
    priceCents: 9900,
    billingCadence: "per year",
    description:
      "For the dedicated hobbyist, GM, and collector who wants the absolute best deal.",
    benefits: [
      "20% OFF Purchases at the Counter",
      "25% OFF Most Pre-Orders",
      "10% Additional Store Credit on Trade-Ins",
      "Exclusive Offers Throughout the Year",
      "Access to VIP Weekends",
    ],
    purchaseActionLabel: "Go Premium",
  },
];

describe("TierComparison Component", () => {
  it("renders both VIP tier cards with name, price, and benefits", () => {
    render(<TierComparison plans={mockPlans} />);

    expect(screen.getByText("VIP Basic")).toBeInTheDocument();
    expect(screen.getByText("$25 per year")).toBeInTheDocument();
    expect(
      screen.getByText("15% OFF Purchases at the Counter")
    ).toBeInTheDocument();

    expect(screen.getByText("VIP Premium")).toBeInTheDocument();
    expect(screen.getByText("$99 per year")).toBeInTheDocument();
    expect(
      screen.getByText("20% OFF Purchases at the Counter")
    ).toBeInTheDocument();
  });

  it("renders purchase action links for each tier (US3)", () => {
    render(<TierComparison plans={mockPlans} />);

    const basicBtn = screen.getByRole("button", { name: "Join VIP Basic" });
    const premiumBtn = screen.getByRole("button", { name: "Go Premium" });

    expect(basicBtn).toBeInTheDocument();
    expect(premiumBtn).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links.some((link) => link.getAttribute("href") === "/checkout")).toBe(
      true
    );
  });

  it("renders graceful empty state when plans array is empty (no mock data fallback)", () => {
    render(<TierComparison plans={[]} />);

    expect(
      screen.getByText("Membership options are unavailable right now.")
    ).toBeInTheDocument();
    expect(screen.queryByText("VIP Basic")).not.toBeInTheDocument();
    expect(screen.queryByText("VIP Premium")).not.toBeInTheDocument();
  });
});