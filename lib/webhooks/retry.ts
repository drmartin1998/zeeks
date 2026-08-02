/**
 * Exponential backoff retry utility.
 *
 * Retries an async function up to `maxAttempts` times with delays of
 * 1s, 2s, 4s, ... (doubling each time). Each attempt is subject to a
 * per-call timeout of `timeoutMs` milliseconds.
 *
 * @param fn       The async function to retry.
 * @param options  Retry configuration.
 * @returns        The resolved value of `fn` on success.
 * @throws         The last error if all attempts are exhausted.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const timeoutMs = options.timeoutMs ?? 3000;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await withTimeout(fn(), timeoutMs);
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, ...
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Wraps a promise with a timeout. Rejects if the promise doesn't settle
 * within `ms` milliseconds.
 */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  if (AbortSignal.timeout) {
    // Node 18+ / modern runtimes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ms);
    try {
      // Wrap the original promise to reject on abort
      const result = await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new Error(`Operation timed out after ${ms}ms`));
          });
        }),
      ]);
      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Fallback for environments without AbortSignal.timeout
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
