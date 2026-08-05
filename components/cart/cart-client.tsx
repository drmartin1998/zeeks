"use client";

import { useState, type ReactNode } from "react";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { ShoppingBag } from "lucide-react";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { clearCart } from "@/app/cart/actions";
import type { Cart as CartType } from "@/lib/square/types";

interface CartClientProps {
  cart: CartType | null;
  error: string | null;
  squareCustomerId: string | null;
  loyaltyPanel?: ReactNode;
  earnedPointsNotice?: ReactNode;
  hasReward?: boolean;
}

export function CartClient({
  cart,
  error,
  squareCustomerId,
  loyaltyPanel,
  earnedPointsNotice,
  hasReward = false,
}: CartClientProps) {
  const [clearing, setClearing] = useState(false);
  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-5">
        <div className="text-center">
          <p className="text-lg text-red-600">{error}</p>
          <NextLink href="/" className="mt-4 inline-block text-sm text-status-promo underline">
            Return to Home
          </NextLink>
        </div>
      </div>
    );
  }

  if (!cart || cart.lineItems.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-5">
        <div className="text-center">
          <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-border-default" />
          <h2 className="text-xl font-semibold text-text-primary">
            Your cart is empty
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Items you add to your cart will appear here.
          </p>
          <NextLink href="/shop">
            <Button variant="primary" size="lg" className="mt-6">
              Browse Products
            </Button>
          </NextLink>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex max-w-[1440px] flex-col gap-16 px-5 pt-16 pb-[100px] sm:px-10 lg:flex-row lg:px-20"
    >
      {/* Cart Items Column */}
      <div className="flex w-full flex-col gap-8 lg:w-[800px]">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-[32px] font-black leading-[40px] text-text-primary">
            Shopping Cart
          </h1>
          <button
            onClick={async () => {
              setClearing(true);
              await clearCart(cart.orderId);
              setClearing(false);
              window.location.reload();
            }}
            disabled={clearing}
            className="text-sm text-text-muted underline hover:text-text-primary disabled:opacity-50"
          >
            {clearing ? "Clearing..." : "Clear Cart"}
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {cart.lineItems.map((item) => (
            <CartLineItem
              key={item.uid}
              item={item}
              orderId={cart.orderId}
            />
          ))}
        </div>

        {loyaltyPanel}
      </div>

      {/* Order Summary Sidebar */}
      <div className="flex flex-col gap-4 lg:w-[416px]">
        <CartSummary
          subtotal={cart.subtotal}
          hasUnavailable={cart.lineItems.some((item) => item.isUnavailable)}
          hasReward={hasReward}
        />
        {earnedPointsNotice}
      </div>
    </div>
  );
}
