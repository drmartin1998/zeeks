import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HeroCta = {
  label?: string;
  href?: string;
};

export type HeroSectionProps = {
  eyebrow?: string | null;
  heading?: string | null;
  subheading?: string | null;
  imageUrl?: string | null;
  primaryCta?: HeroCta | null;
  secondaryCta?: HeroCta | null;
};

function renderCta(
  cta: HeroCta | null | undefined,
  variant: "primary" | "secondary",
) {
  if (!cta?.label || !cta.href) return null;
  return (
    <a
      href={cta.href}
      className={cn(buttonVariants({ variant, size: "xl" }), "px-6")}
    >
      {cta.label}
    </a>
  );
}

export function HeroSection({
  eyebrow,
  heading,
  subheading,
  imageUrl,
  primaryCta,
  secondaryCta,
}: HeroSectionProps) {
  return (
    <section className="relative flex h-[600px] w-full items-center overflow-hidden bg-neutral-900">
      {/* Hero background image */}
      <div className="absolute inset-0">
        {imageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('${imageUrl}')` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/80 via-neutral-900/50 to-neutral-900/20" />
      </div>

      {/* Content - left aligned */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col px-4 md:px-8 lg:px-20">
        <div className="flex max-w-[640px] flex-col gap-4">
          {eyebrow && (
            <div className="inline-flex h-[26px] w-fit items-center rounded px-3 bg-status-sale">
              <span className="text-xs font-semibold text-white uppercase">
                {eyebrow}
              </span>
            </div>
          )}

          {heading && (
            <h1 className="text-[40px] font-black leading-none text-white md:text-[48px] lg:text-[64px] xl:text-7xl">
              {heading}
            </h1>
          )}

          {subheading && (
            <p className="max-w-[640px] text-base leading-relaxed text-white/80 md:text-lg lg:text-xl">
              {subheading}
            </p>
          )}

          {(primaryCta || secondaryCta) && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              {renderCta(primaryCta, "primary")}
              {renderCta(secondaryCta, "secondary")}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
