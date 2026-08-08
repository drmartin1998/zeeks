import { catalogApi } from "@/lib/square/client";
import type { VipSubscriptionPlan } from "@/lib/square/types";

// ---------------------------------------------------------------------------
// VIP tier configuration
// ---------------------------------------------------------------------------

/**
 * The known VIP subscription plan names that are purchasable on the VIP
 * Program page. These correspond to Square catalog objects of type
 * `SUBSCRIPTION_PLAN`. Only plans whose name matches one of these are surfaced
 * on the page. This is a configuration of WHICH tiers exist, not fallback
 * data — plan pricing is always read live from Square (Constitution VII).
 */
const VIP_TIER_NAMES = ["VIP Basic", "VIP Premium"] as const;

/**
 * Fixed presentation copy for each VIP tier: the card description, the benefit
 * list, and the purchase CTA label.
 *
 * These are authored design constants (same category as the hero / FAQ copy on
 * the page) — NOT Square-managed catalog data. Square subscription plans carry
 * no description/benefits field, so the tier's prose is fixed presentation
 * content. What stays LIVE from Square is the plan's identity and price, which
 * decides whether a tier is shown and at what cost.
 */
const TIER_COPY: Record<
  string,
  Pick<VipSubscriptionPlan, "description" | "benefits" | "purchaseActionLabel">
> = {
  "VIP Basic": {
    description:
      "Perfect for casual players looking to stock up on their personal library.",
    benefits: [
      "15% OFF Purchases at the Counter",
      "20% OFF Most Pre-Orders",
      "Access to VIP Weekends",
    ],
    purchaseActionLabel: "Join VIP Basic",
  },
  "VIP Premium": {
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
};

/**
 * Human-readable billing cadence derived from a Square subscription phase.
 * Safe fallback keeps the card readable when the cadence is unparseable.
 */
function cadenceLabel(cadence?: string): string {
  switch (cadence) {
    case "MONTHLY":
      return "per month";
    case "YEARLY":
      return "per year";
    case "WEEKLY":
      return "per week";
    case "DAILY":
      return "per day";
    default:
      return "per billing cycle";
  }
}

/**
 * Map a Square `SUBSCRIPTION_PLAN` catalog object to the internal
 * `VipSubscriptionPlan` shape.
 *
 * Price is read live from the plan's first recurring phase. If no phase or a
 * zero price is present the plan is skipped (it is not a purchasable tier).
 * Presentation copy (description, benefits, CTA) comes from `TIER_COPY`.
 */
function mapSubscriptionPlan(
  plan: import("square").CatalogObjectSubscriptionPlan
): VipSubscriptionPlan | null {
  const data = plan.subscriptionPlanData;
  const name = data?.name;
  if (!name) return null;

  const phase = data.phases?.[0];
  if (!phase) return null;

  const priceCents = Number(phase.recurringPriceMoney?.amount ?? 0);
  if (priceCents <= 0) return null;

  const copy = TIER_COPY[name] ?? {
    description: "",
    benefits: [],
    purchaseActionLabel: "Join",
  };

  return {
    id: plan.id,
    name,
    priceCents,
    billingCadence: cadenceLabel(phase.cadence),
    description: copy.description,
    benefits: copy.benefits,
    purchaseActionLabel: copy.purchaseActionLabel,
  };
}

/**
 * Fetch the purchasable VIP subscription tiers from the Square catalog.
 *
 * Searches for catalog objects of type `SUBSCRIPTION_PLAN`, filters to the
 * known VIP tier names, and maps each to a `VipSubscriptionPlan`. Pricing is
 * always read live from Square — on failure or when no plans match, an empty
 * array is returned so the page can render a graceful empty/error state (it
 * never substitutes hardcoded tier data).
 */
export async function getVipSubscriptionPlans(): Promise<VipSubscriptionPlan[]> {
  try {
    const response = await catalogApi.search({
      objectTypes: ["SUBSCRIPTION_PLAN"],
      includeDeletedObjects: false,
    });

    const objects = response.objects ?? [];

    const plans: VipSubscriptionPlan[] = [];
    for (const obj of objects) {
      if (obj.type !== "SUBSCRIPTION_PLAN") continue;
      const plan = obj as import("square").CatalogObjectSubscriptionPlan;
      const name = plan.subscriptionPlanData?.name;
      if (!name || !VIP_TIER_NAMES.includes(name as (typeof VIP_TIER_NAMES)[number])) {
        continue;
      }
      const mapped = mapSubscriptionPlan(plan);
      if (mapped) plans.push(mapped);
    }

    // Preserve canonical ordering: VIP Basic before VIP Premium.
    const order = VIP_TIER_NAMES as readonly string[];
    plans.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

    return plans;
  } catch (error) {
    console.error(
      "[getVipSubscriptionPlans] Failed to fetch VIP subscription plans:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
}