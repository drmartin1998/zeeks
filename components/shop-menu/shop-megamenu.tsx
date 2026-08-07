"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { NavCategoryNode } from "@/lib/square/types";

/**
 * Desktop full-width megamenu panel for the Shop menu.
 *
 * Renders top-level categories as columns, each with a heading, its
 * subcategory links, level-2 children indented under their parent, and a
 * "Shop All" link. Rendered by `NavBar` when the Shop item is active.
 */
export function ShopMegamenu({
  tree,
  onMouseEnter,
  onMouseLeave,
}: {
  tree: NavCategoryNode[];
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <div
      data-slot="shop-megamenu"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute left-0 right-0 top-full z-50"
    >
      {/* Panel — spans 100% of the screen width */}
      <div className="w-full">
        <div className="rounded-b-xl border border-t-0 border-border-default bg-white shadow-[0_16px_32px_rgba(0,0,0,0.15)]">
          {/* Content constrained to the page container width */}
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-10 gap-y-8 px-4 py-10 md:grid-cols-3 lg:grid-cols-5 lg:px-20">
            {tree.map((top) => (
              <div key={top.label} className="flex flex-col gap-4">
                <Link
                  href={top.href}
                  className="text-base font-bold text-text-primary hover:text-status-sale"
                >
                  {top.label}
                </Link>

                {top.children.length > 0 && (
                  <ul className="flex flex-col gap-3">
                    {top.children.map((sub) => (
                      <li key={sub.label}>
                        <Link
                          href={sub.href}
                          className="block text-sm font-medium text-text-muted hover:text-text-primary"
                        >
                          {sub.label}
                        </Link>
                        {sub.children.length > 0 && (
                          <ul className="mt-1 flex flex-col gap-1 pl-4">
                            {sub.children.map((leaf) => (
                              <li key={leaf.label}>
                                <Link
                                  href={leaf.href}
                                  className="block text-[13px] text-text-muted/80 hover:text-text-primary"
                                >
                                  {leaf.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <Link
                  href={top.href}
                  className={cn(
                    "mt-auto inline-flex w-fit items-center gap-1 text-sm font-medium",
                    "text-status-sale hover:text-status-sale/80"
                  )}
                >
                  Shop All {top.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}