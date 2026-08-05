"use client";

import NextLink from "next/link";
import { ChevronLeft } from "lucide-react";
import { OrderSummary } from "@/components/checkout/order-summary";
import { CustomerInfo } from "@/components/checkout/customer-info";
import { PaymentForm } from "@/components/checkout/payment-form";
import type { CheckoutData, RewardTier } from "@/lib/square/types";

interface CheckoutPageClientProps {
  data: CheckoutData;
  selectedRewardTier: RewardTier | null;
  squareAppId: string;
  squareLocId: string;
}

export function CheckoutPageClient({ data, selectedRewardTier, squareAppId, squareLocId }: CheckoutPageClientProps) {
  const { order, loyaltyData, profile } = data;

  if (!order || order.lineItems.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-5">
        <p className="text-lg text-text-muted">Your cart is empty.</p>
      </div>
    );
  }

  const account = loyaltyData?.account;

  let rewardDiscountLabel: string | null = null;
  let rewardDiscountAmount: number | null = null;

  if (selectedRewardTier) {
    if (selectedRewardTier.discountType === "FIXED_AMOUNT" && selectedRewardTier.discountAmount != null) {
      rewardDiscountLabel = selectedRewardTier.name;
      rewardDiscountAmount = selectedRewardTier.discountAmount;
    } else if (selectedRewardTier.discountType === "FIXED_PERCENTAGE" && selectedRewardTier.discountPercentage != null) {
      const pct = parseFloat(selectedRewardTier.discountPercentage);
      rewardDiscountLabel = selectedRewardTier.name;
      rewardDiscountAmount = Math.round(order.subtotal.amount * (pct / 100));
    }
  }

  const totalAmount = rewardDiscountAmount !== null
    ? order.subtotal.amount - rewardDiscountAmount
    : order.subtotal.amount;

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-16 px-5 pt-16 pb-[100px] sm:px-10 lg:flex-row lg:px-20">
      <div className="flex w-full flex-col gap-8 lg:w-[800px]">
        <NextLink
          href="/cart"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Cart
        </NextLink>

        <div className="flex flex-col gap-6">
          <OrderSummary
            items={order.lineItems}
            subtotal={order.subtotal}
            rewardLabel={rewardDiscountLabel}
            rewardDiscountAmount={rewardDiscountAmount}
            total={{ amount: totalAmount, currency: "USD" }}
          />

          {profile && (
            <CustomerInfo
              name={[profile.givenName, profile.familyName].filter(Boolean).join(" ") || "Customer"}
              email={profile.emailAddress ?? ""}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:w-[416px]">
        <PaymentForm
          orderId={order.orderId}
          squareCustomerId={profile?.id ?? ""}
          rewardTierId={selectedRewardTier?.id ?? ""}
          loyaltyAccountId={account?.id ?? ""}
          squareAppId={squareAppId}
          squareLocId={squareLocId}
        />
      </div>
    </div>
  );
}
