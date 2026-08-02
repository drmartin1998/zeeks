"use client";

import { useState } from "react";

interface QuantityPickerProps {
  min?: number;
  max?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
}

export function QuantityPicker({
  min = 1,
  max = 99,
  defaultValue = 1,
  onChange,
  disabled = false,
}: QuantityPickerProps) {
  const [quantity, setQuantity] = useState(defaultValue);

  const decrement = () => {
    const next = Math.max(min, quantity - 1);
    setQuantity(next);
    onChange?.(next);
  };

  const increment = () => {
    const next = Math.min(max, quantity + 1);
    setQuantity(next);
    onChange?.(next);
  };

  return (
    <div className="inline-flex items-center rounded-md border border-gray-300">
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || quantity <= min}
        className="px-4 py-2 text-lg font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="min-w-[3rem] px-3 py-2 text-center text-lg font-semibold text-gray-900">
        {quantity}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={disabled || quantity >= max}
        className="px-4 py-2 text-lg font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
