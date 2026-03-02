export default function StoreLoading() {
  return (
    <>
      {/* Header skeleton */}
      <div className="pt-10 pb-2 text-center px-6">
        <div className="h-9 w-48 bg-surface rounded-lg animate-pulse mx-auto" />
        <div className="h-4 w-72 bg-surface rounded animate-pulse mx-auto mt-3" />
      </div>

      {/* Tabs skeleton */}
      <div className="px-6 mt-6 mb-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-8 border-b border-border pb-3.5">
            <div className="h-4 w-8 bg-surface rounded animate-pulse" />
            <div className="h-4 w-10 bg-surface rounded animate-pulse" />
            <div className="h-4 w-14 bg-surface rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Grid skeleton */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-surface rounded-lg" />
                <div className="mt-3 space-y-2">
                  <div className="h-3.5 w-3/4 bg-surface rounded" />
                  <div className="h-3 w-1/2 bg-surface rounded" />
                  <div className="h-3.5 w-1/3 bg-surface rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
