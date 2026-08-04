import { fetchLocation, computeOpenStatus } from "@/lib/square/locations";
import type { LocationBarData, SquareLocationHours } from "@/lib/square/types";

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const hour = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  if (m === 0) {
    return `${hour} ${ampm}`;
  }
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function getStatusText(status: LocationBarData["status"]): string {
  switch (status) {
    case "open":
      return "Open Now";
    case "closing-soon":
      return "Closing Soon";
    case "closed":
      return "Closed Now";
    case "closed-today":
      return "Closed Today";
  }
}

function getHoursDisplay(
  periods: SquareLocationHours[],
  timezone: string
): string {
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  });
  const todayAbbr = formatter.format(now).toUpperCase().slice(0, 3);
  const todayPeriod = periods.find((p) => p.dayOfWeek === todayAbbr);

  if (!todayPeriod) {
    return "Closed today";
  }

  const openDisplay = formatTime(todayPeriod.startLocalTime);
  const closeDisplay = formatTime(todayPeriod.endLocalTime);

  return `Open today: ${openDisplay} \u2013 ${closeDisplay}`;
}

export async function getLocationBarData(): Promise<LocationBarData | null> {
  try {
    const location = await fetchLocation();
    if (!location) return null;

    const city = location.address?.locality;
    const state = location.address?.administrativeDistrictLevel1;

    if (!city || !state) return null;

    const timezone = location.timezone ?? "UTC";
    const periods = location.businessHours?.periods as
      | SquareLocationHours[]
      | undefined;

    const status = computeOpenStatus(periods, timezone);
    const hoursDisplay = periods
      ? getHoursDisplay(periods, timezone)
      : "Closed today";

    return {
      cityState: `${city}, ${state}`,
      hoursDisplay,
      status,
      statusText: getStatusText(status),
    };
  } catch {
    return null;
  }
}
