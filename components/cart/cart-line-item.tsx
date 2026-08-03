"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCartItem, removeCartItem } from "@/app/cart/actions";
import Image from "next/image";
import { Trash2, AlertCircle, Loader2 } from "lucide-react";
import type { CartLineItem as CartLineItemType } from "@/lib/square/types";

interface CartLineItemProps {
  item: CartLineItemType;
  orderId: string;
}

export function CartLineItem({ item, orderId }: CartLineItemProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const unitPriceValue = (item.unitPrice.amount / 100).toFixed(2);
  const lineTotalValue = (item.lineTotal.amount / 100).toFixed(2);
  const currentQty = parseInt(item.quantity, 10);

  async function handleUpdate(newQty: number) {
    if (newQty < 1 || newQty > 99) return;
    setError(null);
    const result = await updateCartItem(orderId, item.uid, newQty);
    if (result.success) {
      await new Promise((r) => setTimeout(r, 300));
      router.refresh();
    } else {
      setError(result.error ?? "Failed to update quantity");
    }
  }

  async function handleRemove() {
    setError(null);
    setRemoving(true);
    const result = await removeCartItem(orderId, item.uid);
    if (result.success) {
      await new Promise((r) => setTimeout(r, 300));
      router.refresh();
    } else {
      setRemoving(false);
      setError(result.error ?? "Failed to remove item");
    }
  }

  return (
    <div className="relative flex items-center gap-6 rounded-xl border border-[#CDCDD8] p-4">
      {/* Product Image */}
      <div className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-lg bg-neutral-100">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-neutral-300">
            {item.name[0]}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="font-heading text-base font-semibold text-text-primary">
          {item.name}
        </h3>

        {item.isUnavailable && (
          <span className="text-xs font-medium text-status-sale">
            This item is no longer available
          </span>
        )}

        <span className="text-sm text-text-muted">
          ${unitPriceValue} each
        </span>

        {/* Quantity Controls */}
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleUpdate(currentQty - 1)}
            disabled={currentQty <= 1}
            className="flex h-7 w-7 items-center justify-center rounded border border-border-default text-sm hover:bg-surface-secondary disabled:opacity-50"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-medium">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => handleUpdate(currentQty + 1)}
            className="flex h-7 w-7 items-center justify-center rounded border border-border-default text-sm hover:bg-surface-secondary"
          >
            +
          </button>
        </div>
      </div>

      {/* Line Total + Remove */}
      <div className="flex flex-col items-end gap-2">
        <span className="font-heading text-lg font-bold text-text-primary">
          ${lineTotalValue}
        </span>
        <button
          type="button"
          onClick={handleRemove}
          disabled={removing}
          className="flex h-8 w-8 items-center justify-center rounded text-text-muted hover:bg-surface-secondary hover:text-red-600 disabled:opacity-50"
          aria-label={`Remove ${item.name}`}
        >
          {removing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {error && (
        <div className="absolute bottom-2 left-24 flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
