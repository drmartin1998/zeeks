"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <nav
      className="flex items-center justify-center gap-2 pt-10 pb-20"
      aria-label="Pagination"
    >
      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          "flex h-[38px] w-[38px] items-center justify-center rounded-md transition-colors",
          "bg-surface-secondary hover:bg-border-default",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-3.5 w-3.5 text-text-primary" />
      </button>

      {/* Page numbers */}
      {pages.map((page, i) => {
        if (page === "ellipsis") {
          return (
            <span
              key={`ellipsis-${i}`}
              className="flex h-[37px] w-[41px] items-center justify-center text-sm font-semibold text-text-primary"
            >
              ...
            </span>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={cn(
              "flex h-[37px] min-w-[41px] items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors",
              isActive
                ? "bg-action-secondary text-white"
                : "bg-white text-text-primary hover:bg-surface-secondary"
            )}
            aria-label={`Page ${pageNum}`}
            aria-current={isActive ? "page" : undefined}
          >
            {pageNum}
          </button>
        );
      })}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          "flex h-[38px] w-[38px] items-center justify-center rounded-md transition-colors",
          "bg-surface-secondary hover:bg-border-default",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
        aria-label="Next page"
      >
        <ChevronRight className="h-3.5 w-3.5 text-text-primary" />
      </button>
    </nav>
  );
}

function getVisiblePages(
  current: number,
  total: number
): ("ellipsis" | number)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: ("ellipsis" | number)[] = [];

  // Always show first page
  pages.push(1);

  if (current > 3) {
    pages.push("ellipsis");
  }

  // Pages around current
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis");
  }

  // Always show last page
  if (total > 1) {
    pages.push(total);
  }

  return pages;
}
