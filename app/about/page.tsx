import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "About Us — Zeeks Comics and Games",
  description:
    "Learn about Zeeks Comics and Games — your local store for new comics, miniature war gaming, role-playing games, and card games in Washington, IL since 2015.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <main className="flex-1 overflow-x-hidden">
        {/* Hero Header */}
        <section className="relative flex h-[240px] w-full items-center overflow-hidden bg-neutral-900">
          <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col items-start gap-3 px-4 py-[60px] md:px-8 lg:px-20">
            <nav className="flex items-center gap-2" aria-label="Breadcrumb">
              <Link
                href="/"
                className="text-[13px] font-medium text-white/60 transition-colors hover:text-white"
              >
                Home
              </Link>
              <ChevronRight className="h-2.5 w-2.5 text-white/40" />
              <span className="text-[13px] font-semibold text-status-sale">
                About Us
              </span>
            </nav>

            <h1 className="font-heading text-[32px] italic leading-tight text-status-sale md:text-[44px]">
              Our Story
            </h1>

            <p className="text-[16px] leading-relaxed text-white/80">
              About us
            </p>
          </div>
        </section>

        {/* Content */}
        <div className="mx-auto w-full max-w-[1440px] px-4 py-12 md:px-8 md:py-16 lg:px-20 lg:py-20">
          {/* Story */}
          <section className="max-w-3xl">
            <p className="text-[18px] leading-relaxed text-text-primary">
              Zeek&apos;s Comics and Games opened late summer of 2015. For the
              past 10 Years we have been an innovative, engaging and growing
              community of nerdy customers, fans and family.
            </p>
          </section>

          {/* What We Offer */}
          <section className="mt-12 md:mt-16">
            <h2 className="font-heading text-2xl font-bold text-text-primary">
              What We Offer
            </h2>
            <p className="mt-4 max-w-3xl text-[18px] leading-relaxed text-text-primary">
              At Zeek&apos;s we specialize in New Comics, Miniature War Gaming,
              Role-playing Games, Card Games and more! We strive to offer you
              customer service, selection and flexibility for all of your hobby
              and nerdy related needs.
            </p>
          </section>

          {/* Visit Us */}
          <section className="mt-12 md:mt-16">
            <h2 className="font-heading text-2xl font-bold text-text-primary">
              Visit Us
            </h2>
            <address className="mt-4 max-w-md rounded-lg border border-border-default bg-surface-secondary p-6 not-italic">
              <p className="font-semibold text-text-primary">
                Zeeks Comics and Games
              </p>
              <p className="mt-1 text-text-muted">
                30 Cherry Tree Shopping Center, Suite A4
              </p>
              <p className="text-text-muted">Washington, IL 61571</p>
            </address>
          </section>

          {/* CTA */}
          <section className="mt-12 md:mt-16">
            <Link href="/shop">
              <Button variant="primary" size="xl" className="h-[45px] min-w-[200px] px-6">
                Browse Our Products
              </Button>
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
