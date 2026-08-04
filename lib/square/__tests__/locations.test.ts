import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();

vi.mock("@/lib/square/client", () => ({
  locationsApi: {
    get: (...args: unknown[]) => mockGet(...args),
  },
  locationId: "TEST_LOCATION_ID",
}));

const { fetchLocation, computeOpenStatus } = await import(
  "@/lib/square/locations"
);

describe("fetchLocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the location when API call succeeds", async () => {
    const mockLocation = {
      id: "TEST_LOCATION_ID",
      name: "Test Store",
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
    };

    mockGet.mockResolvedValue({ location: mockLocation });

    const location = await fetchLocation();

    expect(location).toEqual(mockLocation);
    expect(mockGet).toHaveBeenCalledWith({ locationId: "TEST_LOCATION_ID" });
  });

  it("should return null when location is missing from response", async () => {
    mockGet.mockResolvedValue({});

    const location = await fetchLocation();

    expect(location).toBeNull();
  });

  it("should return null when location is undefined", async () => {
    mockGet.mockResolvedValue({ location: undefined });

    const location = await fetchLocation();

    expect(location).toBeNull();
  });

  it("should throw when API call fails", async () => {
    mockGet.mockRejectedValue(new Error("Network error"));

    await expect(fetchLocation()).rejects.toThrow("Network error");
  });
});

describe("computeOpenStatus", () => {
  it("should return open when current time is within hours", () => {
    const periods = [
      { dayOfWeek: "MON", startLocalTime: "09:00", endLocalTime: "21:00" },
    ];
    vi.setSystemTime(new Date("2026-08-03T21:00:00Z"));
    expect(computeOpenStatus(periods, "America/Los_Angeles")).toBe("open");
  });

  it("should return closing-soon within 30 minutes of closing", () => {
    const periods = [
      { dayOfWeek: "MON", startLocalTime: "09:00", endLocalTime: "21:00" },
    ];
    vi.setSystemTime(new Date("2026-08-04T03:45:00Z"));
    expect(computeOpenStatus(periods, "America/Los_Angeles")).toBe("closing-soon");
  });

  it("should return closed when before opening", () => {
    const periods = [
      { dayOfWeek: "MON", startLocalTime: "09:00", endLocalTime: "21:00" },
    ];
    vi.setSystemTime(new Date("2026-08-03T14:00:00Z"));
    expect(computeOpenStatus(periods, "America/Los_Angeles")).toBe("closed");
  });

  it("should return closed after closing", () => {
    const periods = [
      { dayOfWeek: "MON", startLocalTime: "09:00", endLocalTime: "21:00" },
    ];
    vi.setSystemTime(new Date("2026-08-04T05:00:00Z"));
    expect(computeOpenStatus(periods, "America/Los_Angeles")).toBe("closed");
  });

  it("should return closed-today when no periods match today", () => {
    const periods = [
      { dayOfWeek: "SUN", startLocalTime: "09:00", endLocalTime: "21:00" },
    ];
    vi.setSystemTime(new Date("2026-08-03T21:00:00Z"));
    expect(computeOpenStatus(periods, "America/Los_Angeles")).toBe("closed-today");
  });

  it("should return closed-today when periods is undefined", () => {
    expect(computeOpenStatus(undefined, "America/Los_Angeles")).toBe("closed-today");
  });

  it("should return closed-today when periods is empty", () => {
    expect(computeOpenStatus([], "America/Los_Angeles")).toBe("closed-today");
  });

  it("should handle midnight-spanning hours (open after midnight)", () => {
    const periods = [
      { dayOfWeek: "TUE", startLocalTime: "08:00", endLocalTime: "02:00" },
    ];
    vi.setSystemTime(new Date("2026-08-05T08:00:00Z"));
    expect(computeOpenStatus(periods, "America/Los_Angeles")).toBe("open");
  });

  it("should handle midnight-spanning hours (closed after end)", () => {
    const periods = [
      { dayOfWeek: "TUE", startLocalTime: "08:00", endLocalTime: "02:00" },
    ];
    vi.setSystemTime(new Date("2026-08-05T10:00:00Z"));
    expect(computeOpenStatus(periods, "America/Los_Angeles")).toBe("closed");
  });

  it("should handle closing-soon for midnight-spanning hours", () => {
    const periods = [
      { dayOfWeek: "TUE", startLocalTime: "08:00", endLocalTime: "02:00" },
    ];
    vi.setSystemTime(new Date("2026-08-05T08:45:00Z"));
    expect(computeOpenStatus(periods, "America/Los_Angeles")).toBe("closing-soon");
  });
});
