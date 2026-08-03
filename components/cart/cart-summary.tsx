import { Button } from "@/components/ui/button";

interface CartSummaryProps {
  subtotal: { amount: number; currency: string };
  orderId: string;
}

export function CartSummary({ subtotal }: CartSummaryProps) {
  const subtotalValue = (subtotal.amount / 100).toFixed(2);

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

      <Button variant="primary" className="w-full text-sm font-bold uppercase tracking-wide">
        Proceed to Checkout
      </Button>
    </div>
  );
}
