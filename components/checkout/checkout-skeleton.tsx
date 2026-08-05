export function CheckoutSkeleton() {
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-8 px-5 py-16 lg:flex-row lg:px-10">
      <div className="flex flex-1 flex-col gap-6">
        <div className="animate-pulse space-y-4 rounded-2xl border border-[#CDCDD8] bg-[#F5F5F8] p-8">
          <div className="h-6 w-36 rounded bg-gray-200" />
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-48 rounded bg-gray-200" />
                <div className="h-4 w-16 rounded bg-gray-200" />
              </div>
            ))}
          </div>
          <div className="border-t border-[#CDCDD8]" />
          <div className="flex justify-between">
            <div className="h-5 w-16 rounded bg-gray-200" />
            <div className="h-5 w-20 rounded bg-gray-200" />
          </div>
        </div>

        <div className="animate-pulse rounded-2xl border border-[#CDCDD8] bg-white p-8">
          <div className="h-5 w-48 rounded bg-gray-200" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-36 rounded bg-gray-200" />
            <div className="h-4 w-52 rounded bg-gray-200" />
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[420px]">
        <div className="animate-pulse space-y-4 rounded-2xl border border-[#CDCDD8] bg-white p-8">
          <div className="h-5 w-32 rounded bg-gray-200" />
          <div className="h-12 w-full rounded bg-gray-200" />
          <div className="space-y-3">
            <div className="h-10 w-full rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
            <div className="flex gap-3">
              <div className="h-10 flex-1 rounded bg-gray-200" />
              <div className="h-10 w-24 rounded bg-gray-200" />
              <div className="h-10 w-28 rounded bg-gray-200" />
            </div>
          </div>
          <div className="h-12 w-full rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
