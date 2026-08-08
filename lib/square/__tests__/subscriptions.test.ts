import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSearch = vi.fn();
vi.mock("@/lib/square/client", () => ({
  catalogApi: { search: (...args: unknown[]) => mockSearch(...args) },
  locationId: "TEST_LOCATION",
}));

type Phase = {
  cadence: string;
  recurringPriceMoney?: { amount: bigint };
};

function planObject(
  id: string,
  name: string,
  phases?: Phase[]
): import("square").CatalogObjectSubscriptionPlan {
  return {
    id,
    type: "SUBSCRIPTION_PLAN",
    subscriptionPlanData: {
      name,
      phases: phases && phases.length > 0 ? phases : undefined,
    },
  } as import("square").CatalogObjectSubscriptionPlan;
}

describe("getVipSubscriptionPlans", () => {
  beforeEach(() => {
    mockSearch.mockReset();
  });

  it("maps matching VIP plans with live price and presentation copy", async () => {
    mockSearch.mockResolvedValue({
      objects: [
        planObject("plan-basic", "VIP Basic", [
          { cadence: "YEARLY", recurringPriceMoney: { amount: 2500n } },
        ]),
        planObject("plan-premium", "VIP Premium", [
          { cadence: "YEARLY", recurringPriceMoney: { amount: 9900n } },
        ]),
      ],
    });

    const { getVipSubscriptionPlans } = await import(
      "@/lib/square/subscriptions"
    );

    const plans = await getVipSubscriptionPlans();

    expect(plans).toHaveLength(2);
    expect(plans[0]).toMatchObject({
      id: "plan-basic",
      name: "VIP Basic",
      priceCents: 2500,
      billingCadence: "per year",
      purchaseActionLabel: "Join VIP Basic",
    });
    expect(plans[0].benefits).toContain("15% OFF Purchases at the Counter");
    expect(plans[1]).toMatchObject({
      name: "VIP Premium",
      priceCents: 9900,
      billingCadence: "per year",
      purchaseActionLabel: "Go Premium",
    });
  });

  it("preserves canonical tier ordering (Basic before Premium)", async () => {
    mockSearch.mockResolvedValue({
      objects: [
        planObject("plan-premium", "VIP Premium", [
          { cadence: "YEARLY", recurringPriceMoney: { amount: 9900n } },
        ]),
        planObject("plan-basic", "VIP Basic", [
          { cadence: "YEARLY", recurringPriceMoney: { amount: 2500n } },
        ]),
      ],
    });

    const { getVipSubscriptionPlans } = await import(
      "@/lib/square/subscriptions"
    );

    const plans = await getVipSubscriptionPlans();

    expect(plans.map((p) => p.name)).toEqual(["VIP Basic", "VIP Premium"]);
  });

  it("filters out non-VIP subscription plans", async () => {
    mockSearch.mockResolvedValue({
      objects: [
        planObject("plan-other", "Some Other Plan", [
          { cadence: "MONTHLY", recurringPriceMoney: { amount: 500n } },
        ]),
        planObject("plan-basic", "VIP Basic", [
          { cadence: "YEARLY", recurringPriceMoney: { amount: 2500n } },
        ]),
      ],
    });

    const { getVipSubscriptionPlans } = await import(
      "@/lib/square/subscriptions"
    );

    const plans = await getVipSubscriptionPlans();

    expect(plans).toHaveLength(1);
    expect(plans[0].name).toBe("VIP Basic");
  });

  it("skips plans without a pricing phase", async () => {
    mockSearch.mockResolvedValue({
      objects: [planObject("plan-basic", "VIP Basic", [])],
    });

    const { getVipSubscriptionPlans } = await import(
      "@/lib/square/subscriptions"
    );

    const plans = await getVipSubscriptionPlans();

    expect(plans).toHaveLength(0);
  });

  it("returns an empty array when the Square API fails", async () => {
    mockSearch.mockRejectedValue(new Error("Network Error"));

    const { getVipSubscriptionPlans } = await import(
      "@/lib/square/subscriptions"
    );

    const plans = await getVipSubscriptionPlans();

    expect(plans).toEqual([]);
  });
});