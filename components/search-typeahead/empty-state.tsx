"use client";

import { SearchX } from "lucide-react";

interface EmptyStateProps {
  query: string;
}

export function EmptyState({ query }: EmptyStateProps) {
  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 flex flex-col items-center gap-5 rounded-[12px] bg-white px-6 py-10 text-center shadow-[0_10px_24px_-4px_rgba(14,14,44,0.08)]">
      {/* Ghost icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary">
        <SearchX className="h-6 w-6 text-text-muted" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-base font-bold text-text-primary">
          No products found for &quot;{query}&quot;
        </p>
        <p className="text-sm text-text-muted">
          Try searching for{" "}
          <span className="font-semibold text-zeeks-purple">&quot;miniatures&quot;</span>,{" "}
          <span className="font-semibold text-zeeks-purple">&quot;board games&quot;</span>, or{" "}
          <span className="font-semibold text-zeeks-purple">&quot;paint&quot;</span>
        </p>
      </div>
    </div>
  );
}