import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function bankersRound(value: number): number {
  const whole = Math.trunc(value);
  const fraction = value - whole;
  if (fraction === 0.5) {
    return whole % 2 === 0 ? whole : whole + 1;
  }
  return Math.round(value);
}

// ---------------------------------------------------------------------------
// Retry utility with exponential backoff
// ---------------------------------------------------------------------------

/** Error types that are safe to retry (transient failures). */
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds before first retry (default: 500) */
  baseDelayMs?: number;
  /** Exponential backoff multiplier (default: 2) */
  multiplier?: number;
  /** Maximum jitter in milliseconds added randomly (default: 100) */
  jitterMs?: number;
}

/**
 * Wraps an async operation with exponential backoff retry logic.
 *
 * Retries on transient failures: network errors (fetch failures), HTTP 429
 * (rate limit), and 5xx server errors. Does NOT retry on 400, 401, 403,
 * or 404 — those are client errors that won't change on retry.
 *
 * @param fn - The async function to execute with retry
 * @param options - Retry configuration
 * @returns The result of the function
 * @throws The last error if all retries are exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 500,
    multiplier = 2,
    jitterMs = 100,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt >= maxRetries) break;

      // Only retry on transient errors
      if (!isRetryableError(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff + jitter
      const delay =
        baseDelayMs * Math.pow(multiplier, attempt) +
        Math.random() * jitterMs;

      console.warn(
        `[withRetry] Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms:`,
        error instanceof Error ? error.message : error
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/** Determine if an error is transient and safe to retry. */
function isRetryableError(error: unknown): boolean {
  // Network/HTTP errors often have a status property
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as Record<string, unknown>).status === "number"
  ) {
    return RETRYABLE_STATUSES.has(
      (error as Record<string, number>).status
    );
  }

  // Network errors (fetch failures, timeouts) are always retryable
  if (error instanceof TypeError) return true;

  // Square SDK errors may have a statusCode property
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as Record<string, unknown>).statusCode === "number"
  ) {
    return RETRYABLE_STATUSES.has(
      (error as Record<string, number>).statusCode
    );
  }

  // Default: retry on unknown errors (could be transient network issues)
  return true;
}
