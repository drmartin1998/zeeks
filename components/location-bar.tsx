"use client";

import { Building2 } from "lucide-react";
import type { LocationBarData } from "@/lib/square/types";

interface LocationBarProps {
  locationData: LocationBarData | null;
}

export function LocationBar({ locationData }: LocationBarProps) {
  if (!locationData) {
    return null;
  }

  const statusDotColor = {
    open: "bg-green-500",
    "closing-soon": "bg-amber-500",
    closed: "bg-red-500",
    "closed-today": "bg-red-500",
  }[locationData.status];

  return (
    <div className="border-t border-border-default bg-surface-secondary">
      <div
        className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-1.5 text-xs text-text-muted lg:px-20"
        aria-label={`Store location: ${locationData.cityState}. ${locationData.status !== "closed-today" ? locationData.hoursDisplay + ". " : ""}${locationData.statusText}`}
      >
        <span className="flex items-center gap-1.5 font-semibold text-text-primary">
          <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
          {locationData.cityState}
        </span>
        {locationData.status !== "closed-today" && (
          <>
            <span aria-hidden="true">·</span>
            <span>{locationData.hoursDisplay}</span>
          </>
        )}
        <span className="flex items-center gap-1.5">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${statusDotColor}`}
            aria-hidden="true"
          />
          <span className="font-medium">{locationData.statusText}</span>
        </span>
      </div>
    </div>
  );
}
