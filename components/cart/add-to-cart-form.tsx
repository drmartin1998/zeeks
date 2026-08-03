"use client";

import { useActionState, useEffect } from "react";
import { addToCart } from "@/app/cart/actions";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";
import type { AddToCartResult } from "@/lib/square/types";

interface AddToCartFormProps {
  catalogObjectId: string;
  variationId: string;
  quantity: number;
  disabled?: boolean;
  outOfStock?: boolean;
  className?: string;
  size?: "default" | "lg" | "xl";
}

const initialState: AddToCartResult = {
  success: false,
  lineItemCount: 0,
  error: null,
};

export function AddToCartForm({
  catalogObjectId,
  variationId,
  quantity,
  disabled = false,
  outOfStock = false,
  className,
  size = "lg",
}: AddToCartFormProps) {
  const [state, formAction, isPending] = useActionState(addToCart, initialState);

  useEffect(() => {
    if (state.guestOrderId) {
      document.cookie = `guest-cart-order-id=${state.guestOrderId}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }
  }, [state.guestOrderId]);

  if (outOfStock) {
    return (
      <Button disabled className={className} variant="secondary" size={size}>
        Out of Stock
      </Button>
    );
  }

  if (disabled) {
    return (
      <Button disabled className={className} variant="primary" size={size}>
        Add to Cart
      </Button>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="catalogObjectId" value={catalogObjectId} />
      <input type="hidden" name="variationId" value={variationId} />
      <input type="hidden" name="quantity" value={quantity} />
      <Button
        type="submit"
        disabled={isPending}
        className={className}
        variant="primary"
        size={size}
      >
        {isPending ? (
          <>
            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Adding...
          </>
        ) : state.success ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Added to Cart
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </>
        )}
      </Button>
      {state.error && (
        <p className="mt-2 text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
