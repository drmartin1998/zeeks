"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  /** The display label for the dropdown trigger */
  label: string;
  /** Available options to choose from */
  options: DropdownOption[];
  /** Currently selected value */
  value?: string;
  /** Called when an option is selected */
  onChange: (value: string) => void;
  /** Placeholder text when nothing is selected */
  placeholder?: string;
  /** Additional class names for the outer wrapper */
  className?: string;
}

export function Dropdown({
  label,
  options,
  value,
  onChange,
  placeholder,
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open]);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.label ?? placeholder ?? label;

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [onChange]
  );

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger — matches Figma dropdown trigger */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex h-[35px] w-fit items-center gap-3 rounded-md border-2 bg-white px-4 text-[13px] font-semibold transition-colors",
          "border-[#0e0e2c]/10 hover:border-[#0e0e2c]/20",
          "focus:outline-none focus:border-[#0e0e2c]/30",
          open && "border-[#0e0e2c]"
        )}
        style={{
          fontFamily: "Rubik, sans-serif",
        }}
      >
        <span
          className={cn(
            "whitespace-nowrap",
            selectedOption
              ? "text-text-primary"
              : "text-text-muted"
          )}
        >
          {displayText}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 flex-shrink-0 text-text-muted transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown menu — matches Figma menu */}
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-full overflow-hidden rounded-md border-2 border-[#0e0e2c] bg-white py-0 shadow-lg"
          style={{ minWidth: "100%" }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(option.value);
                  }
                }}
                tabIndex={0}
                className={cn(
                  "flex h-[31px] cursor-pointer items-center whitespace-nowrap px-4 text-[13px] transition-colors",
                  isSelected
                    ? "bg-surface-secondary font-semibold text-text-primary"
                    : "font-normal text-text-primary hover:bg-surface-secondary"
                )}
                style={{
                  fontFamily: "Rubik, sans-serif",
                }}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
