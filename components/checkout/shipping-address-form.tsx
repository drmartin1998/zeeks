"use client";

import { useEffect, useState } from "react";
import type { ShippingAddress } from "@/lib/square/types";

/**
 * Shipping-address form shown when shipping is selected (FR-002).
 *
 * Collects recipient name, street address, city, state, and postal code, with
 * a "same as billing" option that pre-fills the address from billing details.
 * Calls `onChange` with the current address (or null if incomplete).
 */
export function ShippingAddressForm({
  onChange,
  billingAddress,
}: {
  onChange: (address: ShippingAddress | null) => void;
  billingAddress?: ShippingAddress | null;
}) {
  const [useBilling, setUseBilling] = useState(false);
  const [form, setForm] = useState<ShippingAddress>({
    recipientName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
  });

  // When "same as billing" is checked, pre-fill from the billing address.
  // Adjusting state during render from the previous value is the React
  // recommended pattern (avoids setState-in-effect).
  const [prevBilling, setPrevBilling] = useState<{
    useBilling: boolean;
    billingAddress?: ShippingAddress | null;
  }>({ useBilling, billingAddress });
  if (
    useBilling &&
    billingAddress &&
    (prevBilling.useBilling !== useBilling ||
      prevBilling.billingAddress !== billingAddress)
  ) {
    setPrevBilling({ useBilling, billingAddress });
    setForm(billingAddress);
  }

  // Report the current (possibly incomplete) address upward.
  useEffect(() => {
    onChange(useBilling && billingAddress ? billingAddress : form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, useBilling, billingAddress]);

  const setField = (key: keyof ShippingAddress, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const inputClass =
    "w-full rounded-lg border border-[#CDCDD8] bg-white px-4 py-2.5 text-sm";

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm text-text-primary">
        <input
          type="checkbox"
          checked={useBilling}
          onChange={(e) => setUseBilling(e.target.checked)}
          className="h-4 w-4"
        />
        Same as billing address
      </label>

      <div>
        <label className="mb-1 block text-sm font-semibold text-text-primary">
          Recipient Name
        </label>
        <input
          value={form.recipientName}
          onChange={(e) => setField("recipientName", e.target.value)}
          className={inputClass}
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-text-primary">
          Street Address
        </label>
        <input
          value={form.addressLine1}
          onChange={(e) => setField("addressLine1", e.target.value)}
          className={inputClass}
          placeholder="123 Main St"
        />
      </div>
      <div>
        <input
          value={form.addressLine2 ?? ""}
          onChange={(e) => setField("addressLine2", e.target.value)}
          className={inputClass}
          placeholder="Apt, suite, etc. (optional)"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={form.city}
          onChange={(e) => setField("city", e.target.value)}
          className={`${inputClass} min-w-[100px] flex-1`}
          placeholder="City"
        />
        <input
          value={form.state}
          onChange={(e) => setField("state", e.target.value)}
          maxLength={2}
          className={`${inputClass} w-20`}
          placeholder="State"
        />
        <input
          value={form.postalCode}
          onChange={(e) => setField("postalCode", e.target.value)}
          className={`${inputClass} w-28`}
          placeholder="ZIP"
        />
      </div>
    </div>
  );
}