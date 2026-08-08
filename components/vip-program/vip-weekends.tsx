interface VipWeekendFeature {
  title: string;
  description: string;
}

const FEATURES: VipWeekendFeature[] = [
  {
    title: "Extra Discounts",
    description:
      "Take an additional 10% off custom board game sets, miniatures, and core rulebooks during event hours.",
  },
  {
    title: "Exclusive Giveaways",
    description:
      "Standard & Premium members get automatically entered into hourly promos to win rare promos, decks, and accessories.",
  },
  {
    title: "Special Play Events",
    description:
      "Enjoy priority seat reservations for VIP-only tournaments, learn-to-plays, and community campaign sessions.",
  },
];

/**
 * VIP Weekends benefits section for the VIP Program page.
 *
 * Static presentation copy from the Figma `vip-program-page` design.
 */
export function VipWeekends() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-16 md:px-8 lg:px-20">
      <div className="max-w-3xl">
        <h2 className="font-heading text-2xl font-bold text-text-primary md:text-[32px]">
          VIP Weekends
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-text-muted">
          Both tiers get access to VIP Weekends when we host them! Enjoy extra
          discounts, exclusive giveaways, and special community events
          throughout the year. It&apos;s our way of saying thanks for playing
          with us.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {FEATURES.map((feature) => (
          <article
            key={feature.title}
            className="rounded-lg border border-border-default bg-surface-primary p-6"
          >
            <h3 className="font-heading text-lg font-semibold text-text-primary">
              {feature.title}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-text-muted">
              {feature.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}