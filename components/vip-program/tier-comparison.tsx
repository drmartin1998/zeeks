import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VipSubscriptionPlan } from "@/lib/square/types";

interface TierComparisonProps {
  plans: VipSubscriptionPlan[];
}

/** Format a price in cents as a dollar string, e.g. "$25 / year". */
export function formatTierPrice(plan: VipSubscriptionPlan): string {
  const dollars = (plan.priceCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  return `${dollars} ${plan.billingCadence}`;
}

/**
 * Renders the purchasable VIP tiers as a comparison section.
 *
 * Data comes LIVE from the Square catalog via `getVipSubscriptionPlans()`.
 * When no plans are available, a graceful empty state is shown — no
 * fabricated or hardcoded tier data is ever substituted (Constitution VII).
 */
export function TierComparison({ plans }: TierComparisonProps) {
  if (plans.length === 0) {
    return (
      <div className="rounded-lg border border-border-default bg-surface-secondary p-8 text-center">
        <p className="text-lg font-medium text-text-primary">
          Membership options are unavailable right now.
        </p>
        <p className="mt-2 text-text-muted">
          Check back soon, or ask us at the counter for details on joining the
          Zeeks VIP Program.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {plans.map((plan) => (
        <article
          key={plan.id}
          className="flex flex-col rounded-lg border border-border-default bg-surface-primary p-6"
        >
          <h3 className="font-heading text-[22px] font-bold text-text-primary">
            {plan.name}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            {plan.description}
          </p>

          <p className="mt-4 font-heading text-[28px] font-bold text-text-primary">
            {formatTierPrice(plan)}
          </p>

          <ul className="mt-6 flex flex-col gap-3">
            {plan.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-action-primary/15 text-action-secondary">
                  <Check className="size-3" aria-hidden="true" />
                </span>
                <span className="text-[15px] text-text-primary">{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex-1" />

          <Link href="/checkout" className="w-full">
            <Button variant="primary" size="lg" className="h-[45px] w-full">
              {plan.purchaseActionLabel}
            </Button>
          </Link>
        </article>
      ))}
    </div>
  );
}