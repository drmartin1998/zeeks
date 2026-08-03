"use client";

import { Component, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Show } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, ShoppingBag } from "lucide-react";
import type { NavCategory } from "@/lib/square/types";
import { AuthDropdown } from "@/components/auth/auth-dropdown";
import { UserMenu } from "@/components/auth/user-menu";

/** Error boundary catching Clerk component failures per FR-007. */
class ClerkErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface NavBarProps {
  /** Categories pulled from Square API. Always required — no mock data fallback. */
  categories: NavCategory[];
  /** Number of items in the customer's cart. 0 = empty, -1 = error/unknown. Omit to hide badge entirely. */
  cartItemCount?: number;
}

export function NavBar({ categories, cartItemCount }: NavBarProps) {
  const navItems = categories;
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

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
        <form onSubmit={handleSearch} className="flex w-full max-w-full order-last items-center gap-3 rounded-xl border border-border-default bg-white px-4 py-1.5 lg:order-none lg:w-auto lg:flex-1 lg:max-w-[1069px]">
          <Input
            placeholder="Search games, miniatures, and more..."
            className="h-8 border-0 bg-transparent text-sm focus-visible:border-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-action-primary">
            <Search className="h-3.5 w-3.5 text-white" />
          </button>
        </form>

        {/* Actions - always right-aligned */}
        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/cart"
            className="relative flex items-center gap-2 text-white/70 transition-colors hover:text-white"
            aria-label={cartItemCount != null && cartItemCount > 0 ? `Shopping cart, ${cartItemCount} items` : "Shopping cart"}
          >
            <ShoppingBag className="h-5 w-5" />
            {cartItemCount != null && cartItemCount > 0 && (
              <span className="flex items-center rounded-[10px] bg-[#F5A623] px-[6px] py-[2px] text-xs font-bold text-white">
                {cartItemCount}
              </span>
            )}
          </Link>
          <ClerkErrorBoundary
            fallback={
              <span className="text-white/50 text-sm" aria-label="Sign in unavailable">
                Sign in unavailable
              </span>
            }
          >
            <Show when="signed-in">
              <UserMenu />
            </Show>
            <Show when="signed-out">
              <AuthDropdown />
            </Show>
          </ClerkErrorBoundary>
        </div>
      </div>

      {/* Category row - scrollable below lg */}
      <div className="border-t border-border-default bg-white">
        <div className="mx-auto flex h-[56px] max-w-[1440px] items-center gap-4 overflow-x-auto whitespace-nowrap px-4 lg:gap-8 lg:px-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.map((cat) => (
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
