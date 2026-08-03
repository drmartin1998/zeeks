"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { initiateCheckout } from "@/app/cart/actions";
import type { CheckoutResult } from "@/lib/square/types";

interface CartSummaryProps {
  subtotal: { amount: number; currency: string };
  orderId: string;
  squareCustomerId: string;
  hasUnavailable: boolean;
}

function CheckoutButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  if (pending) {
    return (
      <Button
        variant="primary"
        className="w-full text-sm font-bold uppercase tracking-wide"
        disabled
        aria-label="Redirecting to checkout..."
      >
        Redirecting to checkout...
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      className="w-full text-sm font-bold uppercase tracking-wide"
      type="submit"
      disabled={disabled}
      aria-label="Proceed to Checkout"
    >
      Proceed to Checkout
    </Button>
  );
}

export function CartSummary({
  subtotal,
  orderId,
  squareCustomerId,
  hasUnavailable,
}: CartSummaryProps) {
  const subtotalValue = (subtotal.amount / 100).toFixed(2);
  const [state, formAction] = useActionState<CheckoutResult | null, FormData>(
    initiateCheckout,
    null,
  );

  useEffect(() => {
    if (state?.success && state.paymentLinkUrl) {
      window.location.href = state.paymentLinkUrl;
    }
  }, [state]);

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

      <form action={formAction}>
        <input type="hidden" name="orderId" value={orderId} />
        <input
          type="hidden"
          name="squareCustomerId"
          value={squareCustomerId}
        />
        <CheckoutButton disabled={hasUnavailable} />
      </form>
    </div>
  );
}
