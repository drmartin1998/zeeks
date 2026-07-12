"use client";

import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PromoBanner() {
  return (
    <section className="w-full bg-action-primary">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 py-12 md:flex-row md:items-center md:justify-between md:gap-0 md:px-8 lg:px-20 lg:h-[320px]">
        {/* Text content */}
        <div className="flex max-w-[700px] flex-col gap-4">
          <h2 className="text-3xl font-extrabold leading-tight text-white md:text-4xl lg:text-5xl xl:text-6xl">
            ZEEKS REWARDS
          </h2>
          <p className="max-w-[700px] text-lg leading-relaxed text-white/80">
            Join our loyalty program today and unlock an extra 15% off your
            first order of board games. Limited time only.
          </p>
          <Button variant="tertiary" size="xl" className="mt-2 h-[41px] w-fit gap-2 rounded-lg px-6 text-sm font-bold">
            Join Now
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Decorative zap icon */}
        <div className="hidden items-center justify-center lg:flex">
          <div className="flex h-[240px] w-[240px] items-center justify-center">
            <Zap className="h-[200px] w-[200px] text-white/20" />
          </div>
        </div>
      </div>
    </section>
  );
}
