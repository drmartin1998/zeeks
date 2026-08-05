import { Sparkles } from "lucide-react";
import { fetchEarnedPoints } from "@/lib/square/loyalty";
import { isLoyaltyConfigured } from "@/lib/square/loyalty";

interface EarnedPointsNoticeProps {
  squareCustomerId: string | null;
  orderId: string;
}

export async function EarnedPointsNotice({
  squareCustomerId,
  orderId,
}: EarnedPointsNoticeProps) {
  if (!squareCustomerId || !isLoyaltyConfigured()) return null;

  const { points, error } = await fetchEarnedPoints(orderId, squareCustomerId);
  if (error || points === null || points === 0) return null;

  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-white px-3 py-3">
      <Sparkles className="h-4 w-4 shrink-0 text-orange-500" />
      <p className="text-xs font-semibold text-text-primary">
        You&apos;ll earn{" "}
        <span className="font-extrabold text-orange-500">
          {points.toLocaleString()}
        </span>{" "}
        points on this order
      </p>
    </div>
  );
}
