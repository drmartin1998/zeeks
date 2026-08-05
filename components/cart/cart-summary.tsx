"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import NextLink from "next/link";

interface CartSummaryProps {
  subtotal: { amount: number; currency: string };
  hasUnavailable: boolean;
  hasReward?: boolean;
}

export function CartSummary({
  subtotal,
  hasUnavailable,
  hasReward = false,
}: CartSummaryProps) {
  const subtotalValue = (subtotal.amount / 100).toFixed(2);
  const [checkoutHref, setCheckoutHref] = useState("/checkout");

  useEffect(() => {
    function updateHref() {
      const href = new URL("/checkout", window.location.origin);
      const tierInput = document.getElementById("checkout-reward-tier-id") as HTMLInputElement | null;
      const accountInput = document.getElementById("checkout-loyalty-account-id") as HTMLInputElement | null;
      if (tierInput?.value) href.searchParams.set("rewardTierId", tierInput.value);
      if (accountInput?.value) href.searchParams.set("loyaltyAccountId", accountInput.value);
      setCheckoutHref(href.pathname + href.search);
    }
    updateHref();
    const interval = setInterval(updateHref, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-[#CDCDD8] bg-[#F5F5F8] p-8">
      <h2 className="font-heading text-[22px] font-black leading-7 text-text-primary">
        Order Summary
      </h2>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-primary">Subtotal</span>
          <span className="text-sm font-semibold text-text-primary">
            ${subtotalValue}
          </span>
        </div>

        <p className="text-xs leading-[17px] text-text-muted opacity-70">
          Taxes and shipping calculated at checkout
        </p>

        <div className="border-t border-[#CDCDD8]" />

        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-text-primary">
            Total
          </span>
          <span className="font-heading text-lg font-bold text-text-primary">
            ${subtotalValue}
          </span>
        </div>
      </div>

      {hasUnavailable && (
        <p className="text-sm text-red-600">
          Some items in your cart are no longer available. Please remove them to
          continue.
        </p>
      )}

      {hasReward && (
        <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-3">
          <Sparkles className="h-4 w-4 shrink-0 text-orange-500" />
          <p className="text-xs font-semibold text-text-primary">
            Rewards will be applied at checkout
          </p>
        </div>
      )}

      <NextLink href={checkoutHref}>
        <Button
          variant="primary"
          className="w-full text-sm font-bold uppercase tracking-wide"
          type="button"
          disabled={hasUnavailable}
          aria-label="Proceed to Checkout"
        >
          Proceed to Checkout
        </Button>
      </NextLink>
    </div>
  );
}
