export default function ArtisanDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 h-4 w-56 animate-pulse rounded bg-earth-200" />
      <div className="mb-8 h-32 w-full animate-pulse rounded-2xl border border-earth-200 bg-white" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="aspect-[16/10] w-full animate-pulse rounded-2xl bg-earth-200" />
          <div className="h-44 w-full animate-pulse rounded-2xl bg-white" />
        </div>
        <div className="lg:col-span-5">
          <div className="h-[520px] w-full animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    </div>
  );
}
