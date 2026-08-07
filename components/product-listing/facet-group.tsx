"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FacetOptionValue {
  value: string;
  label: string;
  count?: number;
}

interface FacetGroupProps {
  title: string;
  options: FacetOptionValue[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  className?: string;
  /** Render children (e.g., checkbox rows) instead of the default option list */
  children?: ReactNode;
  /** Override the header classes (e.g., the Categories header is 18px ExtraBold). */
  headerClassName?: string;
}

export function FacetGroup({
  title,
  options,
  selectedValues,
  onToggle,
  className,
  children,
  headerClassName,
}: FacetGroupProps) {
  if (options.length === 0 && !children) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <h3
        className={cn(
          "font-heading text-base font-bold uppercase tracking-wide text-text-primary",
          headerClassName
        )}
      >
        {title}
      </h3>
      <div className="flex flex-col gap-2">
        {children
          ? children
          : options.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer select-none items-center gap-2 text-[14px] text-text-primary"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => onToggle(option.value)}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-zeeks-purple"
                />
                <span className="font-medium">{option.label}</span>
                {typeof option.count === "number" && (
                  <span className="text-xs text-text-muted">({option.count})</span>
                )}
              </label>
            ))}
      </div>
    </div>
  );
}