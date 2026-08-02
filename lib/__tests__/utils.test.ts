import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withRetry } from "@/lib/utils";

// ---------------------------------------------------------------------------
// withRetry
// ---------------------------------------------------------------------------

describe("withRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return immediately on success (no retries)", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await withRetry(fn);
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry on TypeError (network error)", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Network error"))
      .mockRejectedValueOnce(new TypeError("Network error"))
      .mockResolvedValue("success");

    const promise = withRetry(fn, { maxRetries: 3, baseDelayMs: 100, jitterMs: 0 });

    // Fast-forward through retries
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should retry on HTTP 429 error", async () => {
    const rateLimitError = new Error("Rate limited") as Error & { status: number };
    (rateLimitError as unknown as Record<string, unknown>).status = 429;

    const fn = vi
      .fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValue("success");

    const promise = withRetry(fn, { maxRetries: 3, baseDelayMs: 100, jitterMs: 0 });
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should NOT retry on HTTP 400 error", async () => {
    const badRequestError = new Error("Bad request") as Error & { status: number };
    (badRequestError as unknown as Record<string, unknown>).status = 400;

    const fn = vi.fn().mockRejectedValue(badRequestError);

    await expect(withRetry(fn, { maxRetries: 3, baseDelayMs: 100, jitterMs: 0 }))
      .rejects.toThrow("Bad request");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should NOT retry on HTTP 401 error", async () => {
    const authError = new Error("Unauthorized") as Error & { status: number };
    (authError as unknown as Record<string, unknown>).status = 401;

    const fn = vi.fn().mockRejectedValue(authError);

    await expect(withRetry(fn, { maxRetries: 3, baseDelayMs: 100, jitterMs: 0 }))
      .rejects.toThrow("Unauthorized");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should throw after exhausting all retries", async () => {
    const error = new TypeError("Persistent network failure");
    const fn = vi.fn().mockRejectedValue(error);

    const promise = withRetry(fn, { maxRetries: 2, baseDelayMs: 100, jitterMs: 0 });

    // Catch the rejection to avoid unhandled rejection
    const caught = promise.catch(() => {});
    await vi.runAllTimersAsync();
    await caught;

    await expect(promise).rejects.toThrow("Persistent network failure");
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("should apply exponential backoff", async () => {
    const error = new TypeError("Fail");
    const fn = vi.fn().mockRejectedValue(error);

    const promise = withRetry(fn, { maxRetries: 2, baseDelayMs: 200, multiplier: 2, jitterMs: 0 });

    // Catch the rejection to avoid unhandled rejection
    const caught = promise.catch(() => {});
    expect(fn).toHaveBeenCalledTimes(1);

    // First retry should be at ~200ms
    await vi.advanceTimersByTimeAsync(199);
    expect(fn).toHaveBeenCalledTimes(1); // not yet
    await vi.advanceTimersByTimeAsync(1);
    expect(fn).toHaveBeenCalledTimes(2);

    // Second retry should be at ~400ms (200 * 2^1)
    await vi.advanceTimersByTimeAsync(399);
    expect(fn).toHaveBeenCalledTimes(2); // not yet
    await vi.advanceTimersByTimeAsync(1);
    expect(fn).toHaveBeenCalledTimes(3);

    await caught;
    await expect(promise).rejects.toThrow("Fail");
  });
});
