import Link from "next/link";
import { ArrowUpRight, Award, MapPin, Sparkles } from "lucide-react";
import type { ArtisanCardDTO } from "@/lib/services/artisans";
import type { Dictionary } from "@/lib/i18n";
import { fmt, initials } from "@/lib/text";
import { CategoryIcon } from "./icons";

export function ArtisanCard({ artisan, t }: { artisan: ArtisanCardDTO; t: Dictionary }) {
  const yearsLabel =
    artisan.yearsExperience === 1
      ? fmt(t.artisan.yearOne, { count: 1 })
      : fmt(t.artisan.years, { count: artisan.yearsExperience });

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-earth-200/80 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-500/10">
      <Link
        href={`/artisans/${artisan.id}`}
        className="relative block aspect-[16/11] w-full overflow-hidden bg-earth-900"
      >
        {artisan.coverUrl ? (
          <img
            src={artisan.coverUrl}
            alt={artisan.fullName}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-700 via-brand-600 to-forest-600 font-display text-3xl font-extrabold text-white">
            {initials(artisan.fullName)}
          </div>
        )}

        {/* Cinematic dark gradient at the bottom of the cover photo */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-earth-900/85 via-earth-900/20 to-transparent" />

        {/* Top badges: Category + Featured */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-earth-900 shadow-sm backdrop-blur-md">
            <CategoryIcon name={artisan.category.icon} className="h-3.5 w-3.5 text-brand-600" />
            {artisan.category.name}
          </span>

          {artisan.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1 text-xs font-bold text-earth-900 shadow-md">
              <Sparkles className="h-3 w-3 fill-current" aria-hidden="true" />
              {t.artisan.featured}
            </span>
          )}
        </div>

        {/* Bottom photo overlay: Location + Experience */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-4 pb-3 pt-6 text-xs text-white">
          <span className="inline-flex items-center gap-1.5 font-semibold drop-shadow">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-forest-400" aria-hidden="true" />
            {artisan.city.name}, {artisan.country.name}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-0.5 text-[11px] font-medium text-earth-100 backdrop-blur-md">
            <Award className="h-3 w-3 text-amber-300" aria-hidden="true" />
            {yearsLabel}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-extrabold tracking-tight text-earth-900 transition-colors group-hover:text-brand-600">
              <Link href={`/artisans/${artisan.id}`} className="focus:outline-none">
                {artisan.fullName}
              </Link>
            </h3>
            {artisan.businessName && (
              <p className="truncate text-xs font-semibold text-brand-600/90">
                {artisan.businessName}
              </p>
            )}
          </div>
        </div>

        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-earth-600">
          {artisan.bioExcerpt}
        </p>

        {artisan.services.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-1.5">
            {artisan.services.slice(0, 3).map((s) => (
              <span
                key={s}
                className="max-w-full truncate rounded-full border border-earth-200/80 bg-earth-50 px-2.5 py-0.5 text-[11px] font-semibold text-earth-700"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-1">
          <Link
            href={`/artisans/${artisan.id}`}
            className="inline-flex w-full items-center justify-between rounded-2xl bg-earth-100/80 px-4 py-2.5 text-xs font-bold text-earth-900 transition-all group-hover:bg-gradient-to-r group-hover:from-brand-600 group-hover:to-brand-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-brand-500/20"
          >
            <span>{t.artisan.viewProfile}</span>
            <ArrowUpRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
