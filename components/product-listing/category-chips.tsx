"use client";

import { cn } from "@/lib/utils";

export interface CategoryChipOption {
  slug: string;
  name: string;
  count?: number;
}

interface CategoryChipsProps {
  title?: string;
  options: CategoryChipOption[];
  selectedValues: string[];
  onToggle: (slug: string) => void;
  className?: string;
}

export function CategoryChips({
  title = "Categories",
  options,
  selectedValues,
  onToggle,
  className,
}: CategoryChipsProps) {
  if (options.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {title && (
        <h3 className="font-heading text-[18px] font-extrabold uppercase tracking-wide text-text-primary">
          {title}
        </h3>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = selectedValues.includes(option.slug);
          return (
            <button
              key={option.slug}
              type="button"
              onClick={() => onToggle(option.slug)}
              aria-pressed={selected}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors",
                selected
                  ? "bg-zeeks-purple text-white"
                  : "bg-surface-secondary text-text-primary hover:bg-surface-secondary/70"
              )}
            >
              {option.name}
              {typeof option.count === "number" && (
                <span
                  className={cn(
                    "text-xs",
                    selected ? "text-white/80" : "text-text-muted"
                  )}
                >
                  ({option.count})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}