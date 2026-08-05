"use client";

import { useState, useCallback } from "react";
import { Award, Sparkles } from "lucide-react";
import { RewardOption } from "@/components/cart/loyalty-panel/reward-option";
import type { LoyaltyPanelData, RewardTier } from "@/lib/square/types";

interface LoyaltyPanelClientProps {
  data: LoyaltyPanelData;
}

export function LoyaltyPanelClient({ data }: LoyaltyPanelClientProps) {
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  if (data.error && !data.account) {
    if (showRetry) {
      return (
        <div className="w-full rounded-2xl bg-[#FDF8F0] p-7 text-center">
          <p className="text-sm text-tertiary">Rewards unavailable</p>
          <button
            onClick={handleRetry}
            className="mt-2 text-sm font-semibold text-orange-500 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      );
    }
    setShowRetry(true);
  }

  if (!data.account || !data.program || data.program.rewardTiers.length === 0) {
    return null;
  }

  const { account, program } = data;
  const tiers = program.rewardTiers;
  const remainingPoints =
    selectedTierId !== null
      ? account.balance -
        (tiers.find((t: RewardTier) => t.id === selectedTierId)?.points ?? 0)
      : account.balance;

  const handleSelect = useCallback((tierId: string) => {
    setSelectedTierId(tierId);
  }, []);

  const handleDeselect = useCallback(() => {
    setSelectedTierId(null);
  }, []);

  return (
    <div
      className="w-full rounded-2xl bg-[#FDF8F0] p-7"
      role="region"
      aria-label="Squares Loyalty Rewards"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-500">
            <Award className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-base font-extrabold text-text-primary">
              Squares Loyalty
            </p>
            <p className="text-xs font-semibold text-orange-500">MEMBER</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[22px] font-extrabold leading-7 text-orange-500">
            {account.balance.toLocaleString()}
            <span className="ml-1 text-sm font-semibold text-tertiary">
              points available
            </span>
          </p>
        </div>
      </div>

      <div className="my-6 border-t border-[#CDCDD8]" />

      <h3 className="mb-4 text-[15px] font-bold text-text-primary">
        Apply Your Rewards
      </h3>

      <div role="radiogroup" aria-label="Apply Your Rewards" className="space-y-3">
        {tiers.map((tier: RewardTier) => (
          <RewardOption
            key={tier.id}
            tier={tier}
            isSelected={selectedTierId === tier.id}
            isAffordable={tier.points <= account.balance}
            isDisabled={false}
            onSelect={handleSelect}
            onDeselect={handleDeselect}
          />
        ))}
      </div>

      {selectedTierId !== null && (
        <div className="mt-6 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-500" />
          <p className="text-[13px] text-tertiary">
            <span className="font-bold text-orange-500">
              {remainingPoints.toLocaleString()}
            </span>{" "}
            points remaining after purchase
          </p>
        </div>
      )}

      <input type="hidden" id="checkout-reward-tier-id" value={selectedTierId ?? ""} />
      <input type="hidden" id="checkout-loyalty-account-id" value={account.id ?? ""} />
    </div>
  );
}
