import Link from "next/link";
import { RotateCcw, SearchX } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { plural } from "@/lib/i18n";
import { getCategoriesWithCounts, getCitiesOfCountry, getCountries } from "@/lib/services/catalog";
import {
  parseArtisanQueryLenient,
  searchParamsToObject,
  searchPublicArtisans,
} from "@/lib/services/artisans";
import { DirectoryFilters } from "@/components/DirectoryFilters";
import { ArtisanCard } from "@/components/ArtisanCard";
import { Pagination } from "@/components/Pagination";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ArtisansDirectoryPage({ searchParams }: Props) {
  const { locale, t } = await getI18n();
  const raw = searchParamsToObject(await searchParams);
  const query = parseArtisanQueryLenient(raw);

  const [categories, countries, results] = await Promise.all([
    getCategoriesWithCounts(locale),
    getCountries(locale),
    searchPublicArtisans(query, locale),
  ]);

  const selectedCountry = countries.find(
    (c) => c.code.toLowerCase() === (query.country ?? "").toLowerCase() || String(c.id) === query.country,
  );
  const initialCities = selectedCountry ? (await getCitiesOfCountry(selectedCountry.id)) ?? [] : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-earth-900 sm:text-3xl">
          {t.search.directoryTitle}
        </h1>
        <p className="mt-1 text-sm text-earth-600">{t.search.directorySubtitle}</p>
      </div>

      <DirectoryFilters
        categories={categories}
        countries={countries}
        initialCities={initialCities}
        current={query}
      />

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm font-semibold text-earth-800">
          {plural(results.total, t.common.resultsOne, t.common.resultsOther, locale)}
        </p>
      </div>

      {results.items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-earth-200 bg-white px-6 py-16 text-center shadow-card">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <SearchX className="h-7 w-7" />
          </span>
          <h2 className="font-display text-xl font-bold text-earth-900">
            {t.search.noResultsTitle}
          </h2>
          <p className="mt-2 max-w-md text-sm text-earth-600">{t.search.noResultsText}</p>
          <Link
            href="/artisans"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{t.search.resetSearch}</span>
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.items.map((artisan) => (
              <ArtisanCard key={artisan.id} artisan={artisan} t={t} />
            ))}
          </div>

          <Pagination
            page={results.page}
            totalPages={results.totalPages}
            basePath="/artisans"
            query={{
              q: query.q,
              category: query.category,
              country: query.country,
              city: query.city,
              sort: query.sort,
              featured: query.featured,
            }}
            t={t}
          />
        </>
      )}
    </div>
  );
}
