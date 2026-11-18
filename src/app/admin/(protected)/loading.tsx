export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-52 animate-pulse rounded-lg bg-earth-200" />
        <div className="h-4 w-72 animate-pulse rounded bg-earth-200/70" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-earth-200 bg-white"
          />
        ))}
      </div>
      <div className="h-80 w-full animate-pulse rounded-2xl border border-earth-200 bg-white" />
    </div>
  );
}
