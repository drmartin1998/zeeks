export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <section className="w-full">
      <div
        className="grid justify-center gap-6"
        style={{
          gridTemplateColumns: "repeat(auto-fill, 280px)",
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-xl border border-border-default bg-surface-secondary"
          >
            <div className="aspect-[4/3] w-full bg-gray-200" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-200" />
              <div className="h-5 w-1/3 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}