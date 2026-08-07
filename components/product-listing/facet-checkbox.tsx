"use client";

import { cn } from "@/lib/utils";

export interface FacetCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Optional count shown next to the label, e.g., "(12)" */
  count?: number;
  disabled?: boolean;
}

export function FacetCheckbox({
  label,
  checked,
  onChange,
  count,
  disabled = false,
}: FacetCheckboxProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 text-[14px] text-text-primary transition-colors",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-zeeks-purple"
      />
      <span className="font-medium">{label}</span>
      {typeof count === "number" && (
        <span className="text-xs text-text-muted">({count})</span>
      )}
    </label>
  );
}