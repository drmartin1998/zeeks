"use client";

import Link from "next/link";
import { Sparkles, UserPlus, LogIn } from "lucide-react";

interface GuestLoyaltyNotificationProps {
  isGuest: boolean;
  cartIsNonEmpty: boolean;
  checkoutPath: string;
  isLoyaltyConfigured: boolean;
}

export function GuestLoyaltyNotification({
  isGuest,
  cartIsNonEmpty,
  checkoutPath,
  isLoyaltyConfigured,
}: GuestLoyaltyNotificationProps) {
  if (!isGuest || !cartIsNonEmpty || !isLoyaltyConfigured) return null;

  return (
    <div
      role="status"
      aria-label="Loyalty program notification"
      className="relative flex flex-col gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
        <div>
          <p className="text-sm font-semibold text-text-primary">
            Earn points and redeem rewards!
          </p>
          <p className="text-xs text-text-muted">
            Register or sign in to start accumulating loyalty points on your
            purchases and to redeem existing rewards.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/sign-up?return_to=${encodeURIComponent(checkoutPath)}`}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#7B4FA2] px-3 py-2 text-xs font-semibold text-white hover:bg-[#6A3F91] transition-colors"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Register
        </Link>
        <Link
          href={`/sign-in?return_to=${encodeURIComponent(checkoutPath)}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#7B4FA2] px-3 py-2 text-xs font-semibold text-[#7B4FA2] hover:bg-[#7B4FA2]/10 transition-colors"
        >
          <LogIn className="h-3.5 w-3.5" />
          Sign In
        </Link>
      </div>
    </div>
  );
}
