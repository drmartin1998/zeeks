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
        className="mx-auto flex max-w-[1440px] items-center gap-6 px-4 py-2 text-sm text-text-muted lg:px-20"
        aria-label={`Store location: ${locationData.cityState}. ${locationData.status !== "closed-today" ? locationData.hoursDisplay + ". " : ""}${locationData.statusText}`}
      >
        <span className="flex items-center gap-1.5 font-medium text-text-primary">
          <Building2 className="h-4 w-4" aria-hidden="true" />
          {locationData.cityState}
        </span>
        {locationData.status !== "closed-today" && (
          <span>{locationData.hoursDisplay}</span>
        )}
        <span className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${statusDotColor}`}
            aria-hidden="true"
          />
          <span className="font-medium">{locationData.statusText}</span>
        </span>
      </div>
    </div>
  );
}
