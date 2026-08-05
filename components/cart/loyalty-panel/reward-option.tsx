"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface RewardOptionProps {
  tier: {
    id: string;
    name: string;
    points: number;
    description: string | null;
  };
  isSelected: boolean;
  isAffordable: boolean;
  isDisabled: boolean;
  onSelect: (tierId: string) => void;
  onDeselect: () => void;
}

export function RewardOption({
  tier,
  isSelected,
  isAffordable,
  isDisabled,
  onSelect,
  onDeselect,
}: RewardOptionProps) {
  if (!isAffordable) {
    return (
      <div
        className="flex items-center gap-4 rounded-xl border border-[#CDCDD8] bg-white px-4 py-4 opacity-50"
        role="radio"
        aria-checked="false"
        aria-disabled="true"
        data-state="unavailable"
      >
        <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-[#CDCDD8] bg-white" />
        <div className="flex-1">
          <p className="text-sm font-bold text-text-primary">{tier.name}</p>
          <p className="text-xs text-tertiary">
            Redeem for {tier.points.toLocaleString()} pts
          </p>
        </div>
        <span className="text-xs font-semibold text-tertiary">
          {tier.points.toLocaleString()} pts
        </span>
      </div>
    );
  }

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      aria-disabled={isDisabled}
      tabIndex={isSelected ? 0 : -1}
      data-state={isSelected ? "selected" : "unselected"}
      onClick={() => {
        if (isDisabled) return;
        if (isSelected) {
          onDeselect();
        } else {
          onSelect(tier.id);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          if (isDisabled) return;
          if (isSelected) {
            onDeselect();
          } else {
            onSelect(tier.id);
          }
        }
      }}
      className={cn(
        "flex cursor-pointer items-center gap-4 rounded-xl bg-white px-4 py-4 transition-colors",
        isSelected
          ? "border-2 border-orange-500"
          : "border border-[#CDCDD8] hover:border-orange-500/50",
        isDisabled && "pointer-events-none opacity-70",
      )}
    >
      {isSelected ? (
        <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-orange-500">
          <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
        </div>
      ) : (
        <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-[#CDCDD8] bg-white" />
      )}

      <div className="flex-1">
        <p className="text-sm font-bold text-text-primary">{tier.name}</p>
        <p className="text-xs text-tertiary">
          Redeem for {tier.points.toLocaleString()} pts
        </p>
      </div>

      {isSelected && (
        <span className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-orange-500">
          Applied
        </span>
      )}

      <span className="text-xs font-semibold text-tertiary">
        {tier.points.toLocaleString()} pts
      </span>
    </div>
  );
}
