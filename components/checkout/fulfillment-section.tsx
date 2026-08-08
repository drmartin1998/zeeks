"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { calculateShippingCost } from "@/lib/checkout/shipping-cost";
import type {
  FulfillmentMethod,
  ShippingAddress,
} from "@/lib/square/types";
import { ShippingAddressForm } from "@/components/checkout/shipping-address-form";

/**
 * Inline fulfillment section on the checkout page (FR-011).
 *
 * Lets the customer choose "Shipping" or "Pickup". When shipping is selected,
 * shows the shipping-address form and a calculated shipping cost. Exposes the
 * chosen method + address upward for persistence.
 */
export function FulfillmentSection({
  subtotalCents,
  onFulfillmentChange,
}: {
  subtotalCents: number;
  onFulfillmentChange: (fulfillment: {
    method: FulfillmentMethod;
    shippingAddress: ShippingAddress | null;
    shippingCostCents: number;
  }) => void;
}) {
  const [method, setMethod] = useState<FulfillmentMethod>("pickup");
  const [address, setAddress] = useState<ShippingAddress | null>(null);

  const shippingCostCents = method === "shipping" ? calculateShippingCost(subtotalCents) : 0;

  const selectMethod = (next: FulfillmentMethod) => {
    setMethod(next);
    if (next === "pickup") {
      setAddress(null);
    }
    onFulfillmentChange({
      method: next,
      shippingAddress: next === "shipping" ? address : null,
      shippingCostCents: next === "shipping" ? shippingCostCents : 0,
    });
  };

  const handleAddressChange = (next: ShippingAddress | null) => {
    setAddress(next);
    onFulfillmentChange({ method, shippingAddress: next, shippingCostCents });
  };

  return (
    <div className="rounded-2xl border border-[#CDCDD8] bg-white p-8">
      <h2 className="font-heading text-[22px] font-black leading-7 text-text-primary">
        Delivery
      </h2>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => selectMethod("shipping")}
          aria-pressed={method === "shipping"}
          className={cn(
            "flex-1 rounded-lg border px-4 py-3 text-left text-sm font-semibold transition-colors",
            method === "shipping"
              ? "border-[#F5A623] bg-[#F5A623]/5 text-text-primary"
              : "border-[#CDCDD8] bg-white text-text-muted hover:text-text-primary"
          )}
        >
          Shipping
        </button>
        <button
          type="button"
          onClick={() => selectMethod("pickup")}
          aria-pressed={method === "pickup"}
          className={cn(
            "flex-1 rounded-lg border px-4 py-3 text-left text-sm font-semibold transition-colors",
            method === "pickup"
              ? "border-[#F5A623] bg-[#F5A623]/5 text-text-primary"
              : "border-[#CDCDD8] bg-white text-text-muted hover:text-text-primary"
          )}
        >
          Pickup
        </button>
      </div>

      {method === "shipping" && (
        <div className="mt-6">
          <ShippingAddressForm onChange={handleAddressChange} />
          <p className="mt-4 text-sm text-text-muted">
            Shipping: {fmt(shippingCostCents)}
          </p>
        </div>
      )}

      {method === "pickup" && (
        <p className="mt-6 text-sm text-text-muted">
          Available for pickup at our store. No shipping fee.
        </p>
      )}
    </div>
  );
}

const fmt = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);