export function LoyaltyPanelSkeleton() {
  return (
    <div className="w-full animate-pulse rounded-2xl bg-[#FDF8F0] p-7">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-gray-200" />
          <div className="space-y-1">
            <div className="h-4 w-28 rounded bg-gray-200" />
            <div className="h-3 w-20 rounded bg-gray-200" />
          </div>
        </div>
        <div className="h-7 w-40 rounded bg-gray-200" />
      </div>
      <div className="my-6 border-t border-[#CDCDD8]" />
      <div className="mb-4 h-4 w-36 rounded bg-gray-200" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex h-[66px] items-center gap-4 rounded-xl bg-white px-4"
          >
            <div className="h-[22px] w-[22px] rounded-full bg-gray-200" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-200" />
            </div>
            <div className="h-5 w-14 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="mt-6 h-4 w-52 rounded bg-gray-200" />
    </div>
  );
}
