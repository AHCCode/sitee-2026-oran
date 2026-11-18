import { ArtisanGridSkeleton } from "@/components/Skeletons";

export default function ArtisansLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 space-y-2">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-earth-200" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-earth-200/70" />
      </div>
      <div className="mb-6 h-24 w-full animate-pulse rounded-2xl border border-earth-200 bg-white" />
      <ArtisanGridSkeleton count={6} />
    </div>
  );
}
