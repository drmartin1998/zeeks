"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavCategoryNode } from "@/lib/square/types";

/**
 * Full-screen mobile drawer for the Shop menu with a three-level drilldown.
 *
 * Level 1: top-level categories. Selecting a category with children advances
 * to Level 2 (subcategories); selecting a subcategory with children advances
 * to Level 3 (leaf subcategories). Each sub-panel has a back control and the
 * selected parent category stays visible in the header. Leaf categories
 * navigate directly.
 */
export function ShopMobileDrawer({
  tree,
  onClose,
}: {
  tree: NavCategoryNode[];
  onClose: () => void;
}) {
  const [top, setTop] = useState<NavCategoryNode | null>(null);
  const [sub, setSub] = useState<NavCategoryNode | null>(null);

  const currentList = sub ? sub.children : top ? top.children : tree;
  const headerTitle = sub ? sub.label : top ? top.label : "Shop";

  const goBack = () => {
    if (sub) setSub(null);
    else if (top) setTop(null);
  };

  return (
    <div
      data-slot="shop-mobile-drawer"
      className="fixed inset-0 z-50 flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="Shop menu"
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between bg-[#0E0E2C] px-4 text-white">
        <button
          type="button"
          onClick={goBack}
          disabled={!top}
          aria-label="Back"
          className={cn("flex items-center gap-1 text-sm", !top && "invisible")}
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <span className="text-base font-semibold">{headerTitle}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-8 w-8 items-center justify-center"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Category list */}
      <div className="flex-1 overflow-y-auto">
        {currentList.map((node) => (
          <div
            key={`${node.label}-${node.href}`}
            className="flex h-14 items-center justify-between border-b border-[#CDCDE0] bg-white pr-4"
          >
            {node.hasChildren ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (sub) setSub(node);
                    else setTop(node);
                  }}
                  className="flex h-full flex-1 items-center pl-4 text-left text-sm font-medium text-text-primary"
                >
                  {node.label}
                </button>
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </>
            ) : (
              <Link
                href={node.href}
                onClick={onClose}
                className="flex h-full flex-1 items-center pl-4 text-sm font-medium text-text-primary"
              >
                {node.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}