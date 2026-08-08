import type { CartLineItem } from "@/lib/square/types";

interface OrderSummaryProps {
  items: CartLineItem[];
  subtotal: { amount: number; currency: string };
  rewardLabel: string | null;
  rewardDiscountAmount: number | null;
  /** Shipping fee in cents (0 for pickup). */
  shippingCost?: number;
  total: { amount: number; currency: string };
}

export function OrderSummary({
  items,
  subtotal,
  rewardLabel,
  rewardDiscountAmount,
  shippingCost = 0,
  total,
}: OrderSummaryProps) {
  const fmt = (cents: number) => (cents / 100).toFixed(2);

  return (
    <div className="rounded-2xl border border-[#CDCDD8] bg-[#F5F5F8] p-8">
      <h2 className="font-heading text-[22px] font-black leading-7 text-text-primary">
        Order Summary
      </h2>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.uid} className="flex justify-between text-sm">
            <span className="text-text-primary">
              {item.name} × {item.quantity}
            </span>
            <span className="font-semibold text-text-primary">
              ${fmt(item.lineTotal.amount)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-[#CDCDD8] pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-primary">Subtotal</span>
          <span className="font-semibold text-text-primary">${fmt(subtotal.amount)}</span>
        </div>

        {rewardLabel && rewardDiscountAmount != null && (
          <div className="flex justify-between text-sm">
            <span className="text-status-promo">{rewardLabel}</span>
            <span className="font-semibold text-status-promo">
              −${fmt(rewardDiscountAmount)}
            </span>
          </div>
        )}

        {shippingCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-text-primary">Shipping</span>
            <span className="font-semibold text-text-primary">
              ${fmt(shippingCost)}
            </span>
          </div>
        )}

        <div className="border-t border-[#CDCDD8] pt-2">
          <div className="flex justify-between">
            <span className="text-base font-semibold text-text-primary">Total</span>
            <span className="font-heading text-lg font-bold text-text-primary">
              ${fmt(total.amount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
