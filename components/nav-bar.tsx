"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, ShoppingBag, User } from "lucide-react";

const CATEGORIES = [
  { label: "Miniatures", href: "#" },
  { label: "Board Games", href: "#" },
  { label: "Card Games", href: "#" },
  { label: "Supplies", href: "#" },
  { label: "About Us", href: "#" },
  { label: "Locations", href: "#" },
  { label: "Sale", href: "#", highlight: true },
];

export function NavBar() {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full overflow-x-hidden",
        "bg-neutral-900",
        "shadow-[0_6px_18px_-6px_rgba(14,14,44,0.05)]"
      )}
    >
      {/* Main nav row */}
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 lg:px-20 lg:h-[88px] lg:flex-nowrap lg:py-0">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <img
            src="/images/logo.png"
            alt="Zeeks Logo"
            className="h-[56px] w-auto object-contain"
          />
        </Link>

        {/* Search bar */}
        <div className="flex w-full max-w-full order-last items-center gap-3 rounded-xl border border-border-default bg-white px-4 py-1.5 lg:order-none lg:w-auto lg:flex-1 lg:max-w-[1069px]">
          <Input
            placeholder="Search games, miniatures, and more..."
            className="h-8 border-0 bg-transparent text-sm focus-visible:border-0"
          />
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-action-primary">
            <Search className="h-3.5 w-3.5 text-white" />
          </div>
        </div>

        {/* Actions - always right-aligned */}
        <div className="ml-auto flex items-center gap-4">
          <button className="text-white/70 transition-colors hover:text-white" aria-label="Shopping bag">
            <ShoppingBag className="h-5 w-5" />
          </button>
          <button className="text-white/70 transition-colors hover:text-white" aria-label="User account">
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Category row - scrollable below lg */}
      <div className="border-t border-border-default bg-white">
        <div className="mx-auto flex h-[56px] max-w-[1440px] items-center gap-4 overflow-x-auto whitespace-nowrap px-4 lg:gap-8 lg:px-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className={cn(
                "shrink-0 text-sm font-medium transition-colors",
                cat.highlight
                  ? "text-status-sale hover:text-status-sale/80"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
