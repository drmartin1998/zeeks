"use client";

import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative flex h-[600px] w-full items-center overflow-hidden bg-neutral-900">
      {/* Hero background image */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/80 via-neutral-900/50 to-neutral-900/20" />
      </div>

      {/* Content - left aligned */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col px-4 md:px-8 lg:px-20">
        <div className="flex max-w-[640px] flex-col gap-4">
          {/* Tagline pill */}
          <div className="inline-flex h-[26px] w-fit items-center rounded px-3 bg-status-sale">
            <span className="text-xs font-semibold text-white uppercase">
              Summer Sale Event
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-[40px] font-black leading-none text-white md:text-[48px] lg:text-[64px] xl:text-7xl">
            THE SUMMER OF STRATEGY
          </h1>

          {/* Description */}
          <p className="max-w-[640px] text-base leading-relaxed text-white/80 md:text-lg lg:text-xl">
            Command your legion, build your empire, or master the arena. Save 15%
            off all miniature wargames through August!
          </p>

          {/* CTA buttons - stack on mobile */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button variant="primary" size="xl" className="h-[45px] w-auto min-w-[140px] px-6">
              Shop the Sale
            </Button>
            <Button variant="secondary" size="xl" className="h-[45px] w-auto min-w-[140px] px-6">
              View Featured
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
