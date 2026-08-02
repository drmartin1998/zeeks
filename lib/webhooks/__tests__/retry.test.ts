import { describe, it, expect, vi } from "vitest";
import { withRetry } from "@/lib/webhooks/retry";

describe("withRetry", () => {
  it("should return result on first successful attempt", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await withRetry(fn, { timeoutMs: 1000 });
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry and succeed after initial failures", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockRejectedValueOnce(new Error("fail 2"))
      .mockResolvedValue("success");
    const result = await withRetry(fn, { maxAttempts: 3, timeoutMs: 1000 });
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should throw after exhausting all attempts", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("always fails"));
    await expect(
      withRetry(fn, { maxAttempts: 3, timeoutMs: 1000 }),
    ).rejects.toThrow("always fails");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should respect custom maxAttempts", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    await expect(
      withRetry(fn, { maxAttempts: 2, timeoutMs: 1000 }),
    ).rejects.toThrow("fail");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should handle timeout by rejecting and retrying", async () => {
    // A function that hangs longer than the timeout
    const fn = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => setTimeout(() => resolve("late"), 200)),
      )
      .mockResolvedValue("success");

    const result = await withRetry(fn, {
      maxAttempts: 2,
      timeoutMs: 50,
    });
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
