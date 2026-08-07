"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SuggestionList } from "@/components/search-typeahead/suggestion-list";
import { EmptyState } from "@/components/search-typeahead/empty-state";
import type { SuggestionData } from "@/components/search-typeahead/suggestion-row";

// Local pure slugify. Deliberately NOT imported from `@/lib/square/catalog`
// because that module transitively imports `@/lib/square/client` (which
// validates Square env vars at module evaluation). Importing it into a client
// component would pull that validation into the browser bundle and throw.
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface SearchResponse {
  products: Array<{
    id: string;
    title: string;
    price: number;
    image?: string | null;
  }>;
  totalCount: number;
}

const DEBOUNCE_MS = 250;
const MAX_SUGGESTIONS = 5;

export function SearchTypeahead() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [empty, setEmpty] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeq = useRef(0);

  const trimmed = query.trim();

  // Fetch suggestions after a debounce pause in typing. Only runs for a
  // non-empty query; the empty-query reset happens in the onChange handler.
  useEffect(() => {
    if (!trimmed) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      const seq = ++requestSeq.current;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/catalog/products/search?q=${encodeURIComponent(trimmed)}&limit=${MAX_SUGGESTIONS}`
        );
        if (!res.ok) {
          setOpen(false);
          return;
        }
        const data: SearchResponse = await res.json();
        // Ignore stale responses from a previous keystroke.
        if (seq !== requestSeq.current) return;
        const mapped: SuggestionData[] = (data.products ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          slug: slugify(p.title),
          price: p.price,
          image: p.image ?? null,
        }));
        setSuggestions(mapped);
        setTotalCount(data.totalCount ?? mapped.length);
        setEmpty(mapped.length === 0);
        setActiveIndex(-1);
        setOpen(true);
      } catch {
        setOpen(false);
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [trimmed]);

  // Close on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const goToSearch = useCallback(() => {
    setOpen(false);
    if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }, [router, trimmed]);

  const selectIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < suggestions.length) {
        router.push(`/products/${suggestions[index].slug}`);
      } else if (index === suggestions.length) {
        goToSearch();
      }
      setOpen(false);
    },
    [router, suggestions, goToSearch]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      // Open on ArrowDown when there are potential suggestions; Enter submits
      // the search directly even when the dropdown is closed.
      if (e.key === "ArrowDown" && trimmed) {
        setOpen(true);
      } else if (e.key === "Enter") {
        e.preventDefault();
        goToSearch();
      }
      return;
    }
    const optionCount = suggestions.length + (suggestions.length > 0 ? 1 : 0); // +1 for "view all"
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) =>
          optionCount > 0 ? (i + 1) % optionCount : -1
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) =>
          optionCount > 0 ? (i - 1 + optionCount) % optionCount : -1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0) selectIndex(activeIndex);
        else goToSearch();
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goToSearch();
  };

  const clearQuery = () => {
    setQuery("");
    setSuggestions([]);
    setTotalCount(0);
    setOpen(false);
    setEmpty(false);
    setActiveIndex(-1);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex w-full max-w-full order-last items-center gap-3 rounded-xl border border-border-default bg-white px-4 py-1.5 lg:order-none lg:w-auto lg:flex-1 lg:max-w-[1069px]"
    >
      <form onSubmit={handleSubmit} className="flex w-full items-center gap-3">
        <div className="relative w-full">
          <Input
            role="combobox"
            aria-expanded={open}
            aria-controls={open ? "search-typeahead-listbox" : undefined}
            aria-autocomplete="list"
            placeholder="Search games, miniatures, and more..."
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              if (!value.trim()) {
                // Empty query: reset the dropdown state immediately.
                setSuggestions([]);
                setTotalCount(0);
                setOpen(false);
                setEmpty(false);
                setLoading(false);
                setActiveIndex(-1);
              }
            }}
            onFocus={() => trimmed && setOpen(true)}
            onKeyDown={handleKeyDown}
            className="h-8 border-0 bg-transparent pr-8 text-sm focus-visible:border-0"
          />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              aria-label="Clear search"
              className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-text-muted hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button type="submit" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-action-primary">
          <Search className="h-3.5 w-3.5 text-white" />
        </button>
      </form>

      {open && !loading && trimmed && suggestions.length > 0 && (
        <SuggestionList
          query={trimmed}
          totalCount={totalCount}
          suggestions={suggestions}
          activeIndex={activeIndex}
          onSelect={selectIndex}
          onPointerMove={setActiveIndex}
          onViewAll={goToSearch}
        />
      )}
      {open && !loading && trimmed && empty && (
        <EmptyState query={trimmed} />
      )}
    </div>
  );
}