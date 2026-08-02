"use client";

import { Component, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignInButton, Show, UserButton } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, ShoppingBag } from "lucide-react";
import type { NavCategory } from "@/lib/square/types";

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
}

export function NavBar({ categories }: NavBarProps) {
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
          <button className="text-white/70 transition-colors hover:text-white" aria-label="Shopping bag">
            <ShoppingBag className="h-5 w-5" />
          </button>
          <ClerkErrorBoundary
            fallback={
              <span className="text-white/50 text-sm" aria-label="Sign in unavailable">
                Sign in unavailable
              </span>
            }
          >
            <Show when="signed-in">
              <UserButton />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white/70 hover:text-white transition-colors cursor-pointer">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </SignInButton>
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
