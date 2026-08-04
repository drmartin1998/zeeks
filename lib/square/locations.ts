import { locationsApi, locationId } from "@/lib/square/client";
import type { SquareLocationHours } from "@/lib/square/types";

export async function fetchLocation() {
  const response = await locationsApi.get({ locationId });
  return response.location ?? null;
}

export function computeOpenStatus(
  periods: SquareLocationHours[] | undefined,
  timezone: string
): "open" | "closing-soon" | "closed" | "closed-today" {
  if (!periods || periods.length === 0) {
    return "closed-today";
  }

  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  });
  const todayAbbr = formatter.format(now).toUpperCase().slice(0, 3);
  const todayIndex = dayNames.indexOf(todayAbbr);
  const prevDayAbbr = dayNames[(todayIndex + 6) % 7];

  const localTimeStr = now.toLocaleString("en-US", { timeZone: timezone });
  const storeNow = new Date(localTimeStr);
  const currentMinutes = storeNow.getHours() * 60 + storeNow.getMinutes();

  const todayPeriod = periods.find((p) => p.dayOfWeek === todayAbbr);
  const prevDayPeriod = periods.find((p) => p.dayOfWeek === prevDayAbbr);

  if (todayPeriod) {
    const [openH, openM] = todayPeriod.startLocalTime.split(":").map(Number);
    const [closeH, closeM] = todayPeriod.endLocalTime.split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (closeMinutes <= openMinutes) {
      if (currentMinutes >= openMinutes) {
        return "open";
      }
      return checkClosingSoon(currentMinutes, closeMinutes, "closed");
    }

    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      return checkClosingSoon(currentMinutes, closeMinutes, "open");
    }

    return "closed";
  }

  if (prevDayPeriod) {
    const [prevOpenH, prevOpenM] = prevDayPeriod.startLocalTime
      .split(":")
      .map(Number);
    const [prevCloseH, prevCloseM] = prevDayPeriod.endLocalTime
      .split(":")
      .map(Number);
    const prevOpenMinutes = prevOpenH * 60 + prevOpenM;
    const prevCloseMinutes = prevCloseH * 60 + prevCloseM;

    if (prevCloseMinutes <= prevOpenMinutes) {
      if (currentMinutes < prevCloseMinutes) {
        return checkClosingSoon(currentMinutes, prevCloseMinutes, "open");
      }
      return "closed";
    }
  }

  return "closed-today";
}

function checkClosingSoon(
  currentMinutes: number,
  closeMinutes: number,
  defaultStatus: "open" | "closed"
): "open" | "closing-soon" | "closed" {
  const closingThreshold = closeMinutes - 30;

  if (closingThreshold <= 0) {
    if (currentMinutes < closeMinutes) {
      return "closing-soon";
    }
    return defaultStatus;
  }

  if (currentMinutes >= closingThreshold && currentMinutes < closeMinutes) {
    return "closing-soon";
  }

  return defaultStatus;
}
