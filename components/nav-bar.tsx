"use client";

import { Component } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";
import type { NavCategory, LocationBarData } from "@/lib/square/types";
import { AuthDropdown } from "@/components/auth/auth-dropdown";
import { UserMenu } from "@/components/auth/user-menu";
import { LocationBar } from "@/components/location-bar";
import { SearchTypeahead } from "@/components/search-typeahead/search-typeahead";

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
  /** Location bar data from Square Locations API. Null when unavailable — bar is hidden. */
  locationData?: LocationBarData | null;
}

export function NavBar({ categories, cartItemCount, locationData }: NavBarProps) {
  const navItems = categories;
  const pathname = usePathname();

  // The password gate page is a standalone full-screen gate; the site nav
  // (logo header) must not render on it.
  if (pathname === "/password") {
    return null;
  }

  return (
    <header
      className={cn(
        "relative z-50 w-full",
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

        {/* Search typeahead */}
        <SearchTypeahead />

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

      {/* Location bar */}
      <LocationBar locationData={locationData ?? null} />
    </header>
  );
}
