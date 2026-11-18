"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import clsx from "clsx";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/text";

export function PhotoGallery({
  artisanName,
  photos,
}: {
  artisanName: string;
  photos: { id: string; url: string; caption: string | null }[];
}) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/10] w-full flex-col items-center justify-center rounded-2xl border border-earth-200 bg-earth-100 p-6 text-earth-500">
        <ImageOff className="mb-2 h-8 w-8" />
        <p className="text-sm font-medium">{t.artisan.noPhotos}</p>
      </div>
    );
  }

  const current = photos[index] ?? photos[0]!;

  function prev() {
    setIndex((i) => (i - 1 + photos.length) % photos.length);
  }

  function next() {
    setIndex((i) => (i + 1) % photos.length);
  }

  return (
    <div className="space-y-3">
      <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-earth-200 bg-earth-900 shadow-card">
        <img
          src={current.url}
          alt={current.caption ?? fmt(t.artisan.photoAlt, { name: artisanName, index: index + 1 })}
          className="h-full w-full object-cover"
        />

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label={t.artisan.previousPhoto}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-earth-900 shadow-md transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label={t.artisan.nextPhoto}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-earth-900 shadow-md transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {current.caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-4 pb-3 pt-8 text-xs font-medium text-white sm:text-sm">
            {current.caption}
          </div>
        )}
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {photos.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setIndex(idx)}
              aria-label={fmt(t.artisan.photoAlt, { name: artisanName, index: idx + 1 })}
              aria-current={idx === index}
              className={clsx(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition",
                idx === index ? "border-brand-600 ring-2 ring-brand-500/30" : "border-transparent opacity-75 hover:opacity-100",
              )}
            >
              <img src={p.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
