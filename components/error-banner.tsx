/**
 * Error banner for displaying user-friendly error states when the
 * Square SDK is unavailable or product data cannot be loaded.
 *
 * Accessible: uses `role="alert"` for screen reader announcement.
 */
export function ErrorBanner({
  message = "Products temporarily unavailable. Please try again.",
}: {
  message?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-8 text-center"
    >
      <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
      <p className="mt-2 text-sm text-red-600">{message}</p>
    </div>
  );
}
