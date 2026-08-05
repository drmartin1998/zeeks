import { Suspense } from "react";
import { LoyaltyPanelSkeleton } from "@/components/cart/loyalty-panel/loyalty-panel-skeleton";
import { LoyaltyPanelClient } from "@/components/cart/loyalty-panel/loyalty-panel-client";
import { getLoyaltyPanelData } from "@/lib/square/loyalty";

interface LoyaltyPanelProps {
  squareCustomerId: string;
  orderId: string;
}

async function LoyaltyPanelContent({ squareCustomerId, orderId }: LoyaltyPanelProps) {
  const data = await getLoyaltyPanelData(squareCustomerId, orderId);
  return <LoyaltyPanelClient data={data} />;
}

export function LoyaltyPanel({ squareCustomerId, orderId }: LoyaltyPanelProps) {
  return (
    <Suspense fallback={<LoyaltyPanelSkeleton />}>
      <LoyaltyPanelContent squareCustomerId={squareCustomerId} orderId={orderId} />
    </Suspense>
  );
}
