/**
 * Empty state displayed when Square returns a catalog with zero products.
 * Distinguished from the ErrorBanner to give the user clear information:
 * the system is working, but there are no items available.
 */
export function EmptyState({
  message = "No products available.",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-lg font-medium text-text-muted">{message}</p>
      <p className="mt-2 text-sm text-text-muted">
        Check back soon for new arrivals.
      </p>
    </div>
  );
}
