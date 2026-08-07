"use client";

import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterToggleProps {
  activeCount: number;
  open: boolean;
  onToggle: () => void;
  className?: string;
}

export function FilterToggle({
  activeCount,
  open,
  onToggle,
  className,
}: FilterToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={cn(
        "flex w-full items-center justify-between rounded-lg bg-surface-secondary px-4 py-3",
        className
      )}
    >
      <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-text-primary">
        <SlidersHorizontal className="h-4 w-4" />
        Filter &amp; Categories
      </span>
      <span className="inline-flex items-center rounded-full bg-zeeks-purple px-3 py-1 text-xs font-bold text-white">
        Active: {activeCount}
      </span>
    </button>
  );
}