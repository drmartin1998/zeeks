import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getSquareCustomerId } from "@/lib/webhooks/clerk";
import { getCart } from "@/lib/square/cart";
import { getLoyaltyPanelData } from "@/lib/square/loyalty";
import { customersApi } from "@/lib/square/client";
import { isSandbox } from "@/lib/env";
import { getGuestCartOrderId } from "@/lib/square/cookies";
import { CheckoutSkeleton } from "@/components/checkout/checkout-skeleton";
import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";
import type { CheckoutData, CustomerProfile, RewardTier } from "@/lib/square/types";

interface Props {
  searchParams: Promise<{ rewardTierId?: string; loyaltyAccountId?: string }>;
}

export default async function CheckoutPage({ searchParams }: Props) {
  const { userId } = await auth();
  const isGuest = !userId;

  const params = await searchParams;
  const squareAppId = process.env.square_application_id || process.env.SQUARE_APPLICATION_ID || "";
  const squareLocId = process.env.square_location_id || process.env.SQUARE_LOCATION_ID || "";
  const isLoyaltyConfigured = !!process.env.SQUARE_LOYALTY_PROGRAM_ID;

  if (isGuest) {
    const guestOrderId = await getGuestCartOrderId();
    if (!guestOrderId) redirect("/cart");

    const cart = await getCart(null, guestOrderId);
    if (!cart || cart.lineItems.length === 0) redirect("/cart");

    const checkoutData: CheckoutData = {
      order: cart,
      loyaltyData: null,
      profile: null,
      error: null,
    };

    return (
      <div className="min-h-screen bg-white">
        <Suspense fallback={<CheckoutSkeleton />}>
          <CheckoutPageClient
            data={checkoutData}
            selectedRewardTier={null}
            squareAppId={squareAppId}
            squareLocId={squareLocId}
            isGuest={true}
            isLoyaltyConfigured={isLoyaltyConfigured}
            isSandbox={isSandbox}
          />
        </Suspense>
      </div>
    );
  }

  const squareCustomerId = await getSquareCustomerId(userId);
  if (!squareCustomerId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-text-muted">Account setup in progress. Please try again shortly.</p>
      </div>
    );
  }

  const cart = await getCart(squareCustomerId);
  if (!cart || cart.lineItems.length === 0) redirect("/cart");

  const [loyaltyDataResult, profileResult] = await Promise.allSettled([
    getLoyaltyPanelData(squareCustomerId, cart.orderId),
    (async (): Promise<CustomerProfile | null> => {
      const resp = await customersApi.get({ customerId: squareCustomerId });
      const c = resp.customer;
      if (!c) return null;
      return {
        id: c.id ?? "",
        givenName: c.givenName ?? undefined,
        familyName: c.familyName ?? undefined,
        emailAddress: c.emailAddress ?? undefined,
        phoneNumber: c.phoneNumber ?? undefined,
      };
    })(),
  ]);

  const loyaltyData = loyaltyDataResult.status === "fulfilled" ? loyaltyDataResult.value : null;

  let selectedRewardTier: RewardTier | null = null;
  if (params.rewardTierId && loyaltyData?.program && loyaltyData?.account) {
    const tier = loyaltyData.program.rewardTiers.find((t) => t.id === params.rewardTierId);
    if (tier && tier.points <= loyaltyData.account.balance) {
      selectedRewardTier = tier;
    }
  }

  const checkoutData: CheckoutData = {
    order: cart,
    loyaltyData,
    profile: profileResult.status === "fulfilled" ? profileResult.value : null,
    error: null,
  };

  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<CheckoutSkeleton />}>
          <CheckoutPageClient
            data={checkoutData}
            selectedRewardTier={selectedRewardTier}
            squareAppId={squareAppId}
            squareLocId={squareLocId}
            isGuest={false}
            isLoyaltyConfigured={isLoyaltyConfigured}
            isSandbox={isSandbox}
          />
      </Suspense>
    </div>
  );
}
