"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Can I upgrade from Standard to Premium?",
    answer:
      "Absolutely! You can upgrade your VIP membership at any point during your year. We'll simply pro-rate the remaining time on your account so you only pay the difference.",
  },
  {
    question: "How do the discounts apply to my purchases?",
    answer:
      "Discounts are automatically linked to your Zeeks customer account. Just tell the clerk your name or email at the counter, or log into your online store profile, and your VIP discount will be automatically applied.",
  },
  {
    question: "What counts as a pre-order?",
    answer:
      "Any upcoming release (board games, trading card sets, miniatures, or rulebooks) that is registered for pre-order prior to its official street-date. Pre-order discount applies to standard MSRP.",
  },
];

/**
 * FAQ accordion for the VIP Program page.
 *
 * A client leaf component (Constitution I): the interactive expand/collapse
 * behavior lives here, while the page remains a Server Component.
 */
export function VipFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-16 md:px-8 lg:px-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-action-secondary">
          Common Questions
        </p>
        <h2 className="mt-2 font-heading text-2xl font-bold text-text-primary md:text-[32px]">
          Got Questions? We&apos;ve Got Answers
        </h2>
        <p className="mt-3 text-[16px] leading-relaxed text-text-muted">
          Can&apos;t find what you&apos;re looking for? Reach out to us at the
          register or drop us an email at{" "}
          <a
            href="mailto:support@zeeksgames.com"
            className="text-action-secondary underline-offset-4 hover:underline"
          >
            support@zeeksgames.com
          </a>
          .
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.question}
                className="overflow-hidden rounded-lg border border-border-default bg-surface-primary"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-medium text-text-primary">
                    {item.question}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "size-5 shrink-0 text-text-muted transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-border-default px-5 py-4">
                    <p className="text-[15px] leading-relaxed text-text-muted">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}