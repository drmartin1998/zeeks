import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import {
  VipHero,
  TierComparison,
  VipWeekends,
  VipFaq,
} from "@/components/vip-program";
import { getVipSubscriptionPlans } from "@/lib/square/subscriptions";

export const metadata: Metadata = {
  title: "VIP Program — Zeeks Comics and Games",
  description:
    "Join the Zeeks VIP Program to unlock exclusive discounts, early access, and members-only perks.",
};

export default async function VipProgramPage() {
  const plans = await getVipSubscriptionPlans();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <main className="flex-1 overflow-x-hidden">
        <VipHero />

        {/* Membership tiers */}
        <section className="mx-auto w-full max-w-[1440px] px-4 py-16 md:px-8 lg:px-20">
          <div className="max-w-3xl">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-action-secondary">
              Flexible Tiers
            </p>
            <h2 className="mt-2 font-heading text-2xl font-bold text-text-primary md:text-[32px]">
              Choose Your Membership
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-text-muted">
              Two tiers designed to reward you every time you shop. Pick the
              one that fits your style and start saving today.
            </p>
          </div>

          <div className="mt-10">
            <TierComparison plans={plans} />
          </div>
        </section>

        <VipWeekends />
        <VipFaq />
      </main>

      <Footer />
    </div>
  );
}