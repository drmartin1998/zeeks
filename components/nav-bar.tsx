"use client";

import { Component, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, ShoppingBag } from "lucide-react";
import type { CategoryTree, NavCategory, LocationBarData } from "@/lib/square/types";
import { AuthDropdown } from "@/components/auth/auth-dropdown";
import { UserMenu } from "@/components/auth/user-menu";
import { LocationBar } from "@/components/location-bar";
import { SearchTypeahead } from "@/components/search-typeahead/search-typeahead";
import { ShopMegamenu } from "@/components/shop-menu/shop-megamenu";
import { ShopMobileDrawer } from "@/components/shop-menu/shop-mobile-drawer";

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
  /** Hierarchical category tree for the Shop menu. Empty root → Shop menu hidden. */
  categoryTree?: CategoryTree;
  /** Number of items in the customer's cart. 0 = empty, -1 = error/unknown. Omit to hide badge entirely. */
  cartItemCount?: number;
  /** Location bar data from Square Locations API. Null when unavailable — bar is hidden. */
  locationData?: LocationBarData | null;
}

export function NavBar({
  categories,
  categoryTree,
  cartItemCount,
  locationData,
}: NavBarProps) {
  const pathname = usePathname();
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close the menus when the route changes. Adjusting state during render
  // from a previous-pathname value is the React-recommended pattern for
  // reacting to prop changes without a setState-in-effect.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setDesktopOpen(false);
    setMobileOpen(false);
  }

  // Viewport detection: mobile (< 1024px) shows the drawer, desktop the megamenu.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsMobile(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Hover-bridge: a short delayed close lets the pointer move from the Shop
  // button into the panel (or back) without the menu flickering shut. Entering
  // the button or panel cancels the pending close.
  const cancelPendingClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelPendingClose();
    closeTimer.current = setTimeout(() => setDesktopOpen(false), 120);
  }, [cancelPendingClose]);

  const openDesktop = useCallback(() => {
    cancelPendingClose();
    setDesktopOpen(true);
  }, [cancelPendingClose]);

  // Close the desktop megamenu when clicking outside the menu (panel/button).
  useEffect(() => {
    if (!desktopOpen) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setDesktopOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [desktopOpen]);

  // Close the desktop megamenu on Escape.
  useEffect(() => {
    if (!desktopOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDesktopOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [desktopOpen]);

  // The password gate page is a standalone full-screen gate; the site nav
  // (logo header) must not render on it.
  if (pathname === "/password") {
    return null;
  }

  const tree = categoryTree?.root ?? [];
  const hasShop = tree.length > 0;
  // Catalog categories live in the Shop menu; only static/informational links
  // (e.g. About, Events) remain in the row alongside Shop.
  const staticLinks = hasShop
    ? categories.filter(
        (cat) => !tree.some((t) => t.label === cat.label)
      )
    : categories;

  const toggleShop = () => {
    if (isMobile) {
      setMobileOpen((open) => !open);
    } else {
      setDesktopOpen((open) => !open);
    }
  };

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
      <div
        ref={menuRef}
        className="relative border-t border-border-default bg-white"
      >
        <div className="mx-auto flex h-[56px] max-w-[1440px] items-center gap-4 overflow-x-auto whitespace-nowrap px-4 lg:gap-8 lg:px-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <Link
            href="/"
            className="shrink-0 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
          >
            Home
          </Link>

          {hasShop && (
            <button
              type="button"
              onClick={toggleShop}
              onMouseEnter={() => !isMobile && openDesktop()}
              onMouseLeave={() => !isMobile && scheduleClose()}
              aria-haspopup="true"
              aria-expanded={desktopOpen || mobileOpen}
              className={cn(
                "relative flex h-full shrink-0 items-center gap-1 text-sm font-semibold transition-colors",
                desktopOpen
                  ? "text-status-sale"
                  : "text-text-primary hover:text-status-sale"
              )}
            >
              Shop
              {desktopOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {/* Active underline (matches the Figma shop-active-underline) */}
              {desktopOpen && (
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-[3px] rounded-[1.5px] bg-status-sale"
                />
              )}
            </button>
          )}

          {staticLinks.map((cat) => (
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

        {/* Desktop megamenu panel (full-width, below the row) */}
        {hasShop && !isMobile && desktopOpen && (
          <ShopMegamenu
            tree={tree}
            onMouseEnter={cancelPendingClose}
            onMouseLeave={scheduleClose}
          />
        )}

        {/* Click-away backdrop (sibling so it doesn't trap hover) */}
        {hasShop && !isMobile && desktopOpen && (
          <div
            onClick={() => setDesktopOpen(false)}
            aria-hidden
            data-slot="shop-backdrop"
            className="fixed inset-x-0 top-[144px] bottom-0 z-30 bg-[#0E0E2C]/45"
          />
        )}
      </div>

      {/* Mobile drawer */}
      {hasShop && isMobile && mobileOpen && (
        <ShopMobileDrawer tree={tree} onClose={() => setMobileOpen(false)} />
      )}

      {/* Location bar */}
      <LocationBar locationData={locationData ?? null} />
    </header>
  );
}