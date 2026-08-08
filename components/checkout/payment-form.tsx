"use client";

import { useState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { processPayment } from "@/app/cart/actions";
import type { PaymentResult } from "@/lib/square/types";

interface PaymentFormProps {
  orderId: string;
  squareCustomerId: string;
  rewardTierId: string;
  loyaltyAccountId: string;
  squareAppId: string;
  squareLocId: string;
  /** True when running against the Square sandbox (loads the sandbox SDK). */
  isSandbox?: boolean;
  /** True for guest checkout (no signed-in customer). Requires an email. */
  isGuest?: boolean;
  /** Chosen fulfillment method. */
  fulfillmentMethod?: "shipping" | "pickup";
  /** Shipping address (for shipping fulfillment). */
  shippingAddress?: {
    recipientName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
  } | null;
  /** Shipping cost in cents (0 for pickup). */
  shippingCostCents?: number;
}

declare global {
  interface Window {
    Square?: {
      payments: (
        appId: string,
        locId: string,
      ) => {
        card: () => Promise<{
          attach: (selector: string) => Promise<void>;
          tokenize: () => Promise<{
            status: string;
            token?: string;
            errors?: Array<{ message: string }>;
          }>;
        }>;
      };
    };
  }
}

function PayButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      variant="primary"
      className="w-full text-sm font-bold uppercase tracking-wide"
      type="submit"
      disabled={pending}
      aria-label="Pay Now"
    >
      {pending ? "Processing..." : "Pay Now"}
    </Button>
  );
}

export function PaymentForm({
  orderId,
  squareCustomerId,
  rewardTierId,
  loyaltyAccountId,
  squareAppId,
  squareLocId,
  isSandbox = false,
  isGuest = false,
  fulfillmentMethod = "pickup",
  shippingAddress = null,
  shippingCostCents = 0,
}: PaymentFormProps) {
  const cardRef = useRef<{
    tokenize: () => Promise<{ status: string; token?: string; errors?: Array<{ message: string }> }>;
  } | null>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let destroyed = false;
    let currentCard: { tokenize: () => Promise<{ status: string; token?: string; errors?: Array<{ message: string }> }> } | null = null;

    async function initSquare() {
      if (!window.Square) {
        const script = document.createElement("script");
        // The sandbox environment requires the sandbox copy of the Web
        // Payments SDK; the production script will fail to initialize with
        // sandbox credentials.
        script.src = isSandbox
          ? "https://sandbox.web.squarecdn.com/v1/square.js"
          : "https://web.squarecdn.com/v1/square.js";
        script.onload = async () => {
          if (!destroyed) {
            try { await setupCard(); } catch {
              setSdkError("Payment form could not be initialized.");
            }
          }
        };
        script.onerror = () => setSdkError("Payment form could not be loaded.");
        document.body.appendChild(script);
        return;
      }
      await setupCard();
    }

    async function setupCard() {
      try {
        if (!squareAppId || !squareLocId) {
          setSdkError("Payment configuration is missing.");
          return;
        }
        const container = document.getElementById("card-container");
        if (container) container.innerHTML = "";
        const payments = window.Square!.payments(squareAppId, squareLocId);
        const card = await payments.card();
        if (destroyed) return;
        await card.attach("#card-container");
        currentCard = card;
        cardRef.current = card;
      } catch {
        setSdkError("Payment form could not be initialized.");
      }
    }

    initSquare();
    return () => {
      destroyed = true;
      cardRef.current = null;
    };
  }, [squareAppId, squareLocId, isSandbox]);

  if (sdkError) {
    return (
      <div className="rounded-2xl border border-[#CDCDD8] bg-white p-8">
        <p className="text-sm text-red-600">{sdkError}</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-2xl border border-[#CDCDD8] bg-white p-8">
      <h2 className="font-heading text-[22px] font-black leading-7 text-text-primary">
        Payment
      </h2>

      <form
        action={async (formData: FormData) => {
          if (!cardRef.current) return;
          setTokenError(null);

          const tokenResult = await cardRef.current.tokenize();
          if (tokenResult.status !== "OK" || !tokenResult.token) {
            setTokenError(tokenResult.errors?.[0]?.message ?? "Card validation failed.");
            return;
          }

          formData.append("sourceId", tokenResult.token);
          formData.append("orderId", orderId);
          formData.append("squareCustomerId", squareCustomerId);
          formData.append("rewardTierId", rewardTierId);
          formData.append("loyaltyAccountId", loyaltyAccountId);
          formData.append("fulfillmentMethod", fulfillmentMethod);
          formData.append("shippingCostCents", String(shippingCostCents));
          if (shippingAddress) {
            formData.append("shippingName", shippingAddress.recipientName);
            formData.append("shippingLine1", shippingAddress.addressLine1);
            formData.append("shippingLine2", shippingAddress.addressLine2 ?? "");
            formData.append("shippingCity", shippingAddress.city);
            formData.append("shippingState", shippingAddress.state);
            formData.append("shippingPostalCode", shippingAddress.postalCode);
          }
          if (isGuest) {
            formData.append("billingEmail", formData.get("billingEmail")?.toString() ?? "");
          }

          const result = await processPayment(null, formData);
          if (result.success && result.transactionId && result.orderId) {
            router.push(`/order/confirmation?orderId=${result.orderId}`);
          } else {
            setPaymentError(result.error ?? "Payment failed");
          }
        }}
        className="mt-6 min-w-0 space-y-4"
      >
        <div className="min-w-0">
          <label className="mb-1 block text-sm font-semibold text-text-primary">
            Card Information
          </label>
          <div
            id="card-container"
            className="min-h-[44px] w-full overflow-hidden rounded-lg border border-[#CDCDD8] bg-white px-4 py-3"
          />
        </div>

        {isGuest && (
          <div>
            <label className="mb-1 block text-sm font-semibold text-text-primary">
              Email
            </label>
            <input
              name="billingEmail"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-[#CDCDD8] bg-white px-4 py-2.5 text-sm"
              placeholder="you@example.com"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-semibold text-text-primary">
            Name on Card
          </label>
          <input
            name="billingName"
            type="text"
            required
            className="w-full rounded-lg border border-[#CDCDD8] bg-white px-4 py-2.5 text-sm"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-text-primary">
            Billing Address
          </label>
          <input
            name="billingAddressLine1"
            type="text"
            required
            className="w-full rounded-lg border border-[#CDCDD8] bg-white px-4 py-2.5 text-sm"
            placeholder="Street address"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            name="billingCity"
            type="text"
            required
            className="min-w-[100px] flex-1 rounded-lg border border-[#CDCDD8] bg-white px-4 py-2.5 text-sm"
            placeholder="City"
          />
          <input
            name="billingState"
            type="text"
            required
            maxLength={2}
            className="w-20 rounded-lg border border-[#CDCDD8] bg-white px-4 py-2.5 text-sm sm:w-24"
            placeholder="State"
          />
          <input
            name="billingPostalCode"
            type="text"
            required
            className="w-24 rounded-lg border border-[#CDCDD8] bg-white px-4 py-2.5 text-sm sm:w-28"
            placeholder="ZIP"
          />
        </div>

        {tokenError && (
          <p className="text-sm text-red-600" role="alert">{tokenError}</p>
        )}
        {paymentError && (
          <p className="text-sm text-red-600" role="alert">{paymentError}</p>
        )}

        <PayButton />
      </form>
    </div>
  );
}
