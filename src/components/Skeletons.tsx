export function ArtisanCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-earth-200 bg-white shadow-card">
      <div className="aspect-[4/3] w-full animate-pulse bg-earth-200/70" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-2/3 animate-pulse rounded bg-earth-200" />
        <div className="h-3.5 w-1/2 animate-pulse rounded bg-earth-200/70" />
        <div className="space-y-2 pt-1">
          <div className="h-3 w-full animate-pulse rounded bg-earth-100" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-earth-100" />
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-5 w-20 animate-pulse rounded bg-earth-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-earth-100" />
        </div>
      </div>
    </div>
  );
}

export function ArtisanGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ArtisanCardSkeleton key={i} />
      ))}
    </div>
  );
}
