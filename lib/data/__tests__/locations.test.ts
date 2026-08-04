import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/square/locations", () => ({
  fetchLocation: vi.fn(),
  computeOpenStatus: vi.fn().mockReturnValue("open"),
}));

const { fetchLocation, computeOpenStatus } = await import(
  "@/lib/square/locations"
);
const { getLocationBarData } = await import("@/lib/data/locations");

describe("getLocationBarData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return LocationBarData when all data is available", async () => {
    vi.mocked(fetchLocation).mockResolvedValue({
      id: "L1",
      address: {
        locality: "Seattle",
        administrativeDistrictLevel1: "WA",
      },
      timezone: "America/Los_Angeles",
      businessHours: {
        periods: [
          { dayOfWeek: "MON", startLocalTime: "09:00", endLocalTime: "21:00" },
        ],
      },
    });

    const result = await getLocationBarData();

    expect(result).not.toBeNull();
    expect(result!.cityState).toBe("Seattle, WA");
    expect(result!.status).toBe("open");
    expect(result!.statusText).toBe("Open Now");
    expect(result!.hoursDisplay).toContain("Open today");
  });

  it("should return null when fetchLocation returns null", async () => {
    vi.mocked(fetchLocation).mockResolvedValue(null);

    const result = await getLocationBarData();

    expect(result).toBeNull();
  });

  it("should return null when city is missing", async () => {
    vi.mocked(fetchLocation).mockResolvedValue({
      id: "L1",
      address: {
        locality: undefined,
        administrativeDistrictLevel1: "WA",
      },
      timezone: "America/Los_Angeles",
    });

    const result = await getLocationBarData();

    expect(result).toBeNull();
  });

  it("should return null when state is missing", async () => {
    vi.mocked(fetchLocation).mockResolvedValue({
      id: "L1",
      address: {
        locality: "Seattle",
        administrativeDistrictLevel1: undefined,
      },
      timezone: "America/Los_Angeles",
    });

    const result = await getLocationBarData();

    expect(result).toBeNull();
  });

  it("should return null when fetchLocation throws", async () => {
    vi.mocked(fetchLocation).mockRejectedValue(new Error("API down"));

    const result = await getLocationBarData();

    expect(result).toBeNull();
  });

  it("should use UTC as default timezone when timezone is missing", async () => {
    vi.mocked(fetchLocation).mockResolvedValue({
      id: "L1",
      address: {
        locality: "Seattle",
        administrativeDistrictLevel1: "WA",
      },
      timezone: undefined,
      businessHours: {
        periods: [
          { dayOfWeek: "MON", startLocalTime: "09:00", endLocalTime: "21:00" },
        ],
      },
    });

    await getLocationBarData();

    expect(computeOpenStatus).toHaveBeenCalled();
  });

  it("should show 'Closed today' when no periods exist", async () => {
    vi.mocked(fetchLocation).mockResolvedValue({
      id: "L1",
      address: {
        locality: "Seattle",
        administrativeDistrictLevel1: "WA",
      },
      timezone: "America/Los_Angeles",
      businessHours: undefined,
    });

    const result = await getLocationBarData();

    expect(result).not.toBeNull();
    expect(result!.hoursDisplay).toBe("Closed today");
  });

  it("should format time correctly (e.g., 09:00 → 9 AM)", async () => {
    vi.mocked(fetchLocation).mockResolvedValue({
      id: "L1",
      address: {
        locality: "Seattle",
        administrativeDistrictLevel1: "WA",
      },
      timezone: "America/Los_Angeles",
      businessHours: {
        periods: [
          { dayOfWeek: "MON", startLocalTime: "09:00", endLocalTime: "21:00" },
        ],
      },
    });

    vi.setSystemTime(new Date("2026-08-03T21:00:00Z"));

    const result = await getLocationBarData();

    expect(result!.hoursDisplay).toBe("Open today: 9 AM \u2013 9 PM");
  });

  it("should format time with minutes correctly (e.g., 09:30 → 9:30 AM)", async () => {
    vi.mocked(fetchLocation).mockResolvedValue({
      id: "L1",
      address: {
        locality: "Seattle",
        administrativeDistrictLevel1: "WA",
      },
      timezone: "America/Los_Angeles",
      businessHours: {
        periods: [
          { dayOfWeek: "MON", startLocalTime: "09:30", endLocalTime: "21:00" },
        ],
      },
    });

    vi.setSystemTime(new Date("2026-08-03T21:00:00Z"));

    const result = await getLocationBarData();

    expect(result!.hoursDisplay).toBe("Open today: 9:30 AM \u2013 9 PM");
  });

  it("should format PM times correctly", async () => {
    vi.mocked(fetchLocation).mockResolvedValue({
      id: "L1",
      address: {
        locality: "Seattle",
        administrativeDistrictLevel1: "WA",
      },
      timezone: "America/Los_Angeles",
      businessHours: {
        periods: [
          { dayOfWeek: "MON", startLocalTime: "09:00", endLocalTime: "17:30" },
        ],
      },
    });

    vi.setSystemTime(new Date("2026-08-03T21:00:00Z"));

    const result = await getLocationBarData();

    expect(result!.hoursDisplay).toBe("Open today: 9 AM \u2013 5:30 PM");
  });

  it("should show statusText for all statuses", async () => {
    vi.mocked(fetchLocation).mockResolvedValue({
      id: "L1",
      address: {
        locality: "Seattle",
        administrativeDistrictLevel1: "WA",
      },
      timezone: "America/Los_Angeles",
      businessHours: {
        periods: [
          { dayOfWeek: "MON", startLocalTime: "09:00", endLocalTime: "21:00" },
        ],
      },
    });

    vi.mocked(computeOpenStatus).mockReturnValue("closing-soon");
    let result = await getLocationBarData();
    expect(result!.statusText).toBe("Closing Soon");

    vi.mocked(computeOpenStatus).mockReturnValue("closed");
    result = await getLocationBarData();
    expect(result!.statusText).toBe("Closed Now");

    vi.mocked(computeOpenStatus).mockReturnValue("closed-today");
    result = await getLocationBarData();
    expect(result!.statusText).toBe("Closed Today");
  });
});
