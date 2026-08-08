/**
 * Hero section for the VIP Program page.
 *
 * Static presentation copy from the Figma `vip-program-page` design.
 */
export function VipHero() {
  return (
    <section className="relative flex min-h-[320px] w-full items-center overflow-hidden bg-neutral-900">
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col items-start gap-4 px-4 py-[72px] md:px-8 lg:px-20">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-action-secondary">
          Zeeks VIP Program
        </p>
        <h1 className="font-heading text-[34px] italic leading-tight text-white md:text-[48px]">
          Join the Zeeks VIP Program
        </h1>
        <p className="max-w-xl text-[16px] leading-relaxed text-white/80">
          Unlock exclusive discounts, early access, and members-only perks.
        </p>
      </div>
    </section>
  );
}