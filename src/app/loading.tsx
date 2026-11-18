import { ArtisanGridSkeleton } from "@/components/Skeletons";

export default function RootLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-3">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-earth-200" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-earth-200/70" />
      </div>
      <ArtisanGridSkeleton count={6} />
    </div>
  );
}
