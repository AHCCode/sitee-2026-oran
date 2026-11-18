"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Filter, Loader2, RotateCcw, Search, Star, X } from "lucide-react";
import clsx from "clsx";
import { ARTISAN_SORTS, type ArtisanSort } from "@/lib/constants";
import type { CategoryDTO, CityDTO, CountryDTO } from "@/lib/services/catalog";
import type { ArtisanQuery } from "@/lib/services/artisans";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/text";

export function DirectoryFilters({
  categories,
  countries,
  initialCities,
  current,
}: {
  categories: CategoryDTO[];
  countries: CountryDTO[];
  initialCities: CityDTO[];
  current: ArtisanQuery;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(current.q ?? "");
  const [cities, setCities] = useState<CityDTO[]>(initialCities);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    setQ(current.q ?? "");
  }, [current.q]);

  const selectedCountry = countries.find(
    (c) => c.code.toLowerCase() === (current.country ?? "").toLowerCase() || String(c.id) === current.country,
  );

  useEffect(() => {
    if (!selectedCountry) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setLoadingCities(true);
    fetch(`/api/countries/${selectedCountry.id}/cities`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setCities(Array.isArray(json.data) ? json.data : []);
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCities(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCountry?.id]);

  function pushFilters(patch: Partial<Record<keyof ArtisanQuery, string | undefined>>) {
    const next: Record<string, string | undefined> = {
      q: current.q,
      category: current.category,
      country: selectedCountry?.code ?? current.country,
      city: current.city ? String(current.city) : undefined,
      sort: current.sort,
      featured: current.featured,
      ...patch,
    };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (v !== undefined && v !== "") sp.set(k, v);
    }
    const qs = sp.toString();
    startTransition(() => {
      router.push(qs ? `/artisans?${qs}` : "/artisans");
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    pushFilters({ q: q.trim() || undefined });
  }

  function resetAll() {
    setQ("");
    startTransition(() => {
      router.push("/artisans");
    });
  }

  const selectedCategory = categories.find(
    (c) => c.slug === current.category || String(c.id) === current.category,
  );
  const selectedCity = cities.find((c) => c.id === current.city);
  const isFeatured = current.featured === "true" || current.featured === "1";

  const activeBadges: { key: string; label: string; onRemove: () => void }[] = [];
  if (current.q) {
    activeBadges.push({
      key: "q",
      label: fmt(t.search.searchLabel, { q: current.q }),
      onRemove: () => {
        setQ("");
        pushFilters({ q: undefined });
      },
    });
  }
  if (selectedCategory) {
    activeBadges.push({
      key: "category",
      label: selectedCategory.name,
      onRemove: () => pushFilters({ category: undefined }),
    });
  }
  if (selectedCountry) {
    activeBadges.push({
      key: "country",
      label: selectedCountry.name,
      onRemove: () => pushFilters({ country: undefined, city: undefined }),
    });
  }
  if (selectedCity) {
    activeBadges.push({
      key: "city",
      label: selectedCity.name,
      onRemove: () => pushFilters({ city: undefined }),
    });
  }
  if (isFeatured) {
    activeBadges.push({
      key: "featured",
      label: t.search.featuredOnly,
      onRemove: () => pushFilters({ featured: undefined }),
    });
  }

  return (
    <section aria-label={t.search.filters} className="space-y-4">
      <div className="rounded-2xl border border-earth-200 bg-white p-4 shadow-card sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <form onSubmit={handleSearchSubmit} className="relative sm:col-span-2 lg:col-span-4">
            <label htmlFor="dir-q" className="mb-1 block text-xs font-semibold text-earth-700">
              {t.search.keyword}
            </label>
            <div className="relative flex">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-500" />
              <input
                id="dir-q"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.home.searchPlaceholder}
                className="h-10 w-full rounded-l-xl border border-earth-200 bg-earth-50/50 pl-9 pr-3 text-sm text-earth-900 focus:border-brand-500 focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-r-xl bg-brand-600 px-3.5 text-xs font-semibold text-white hover:bg-brand-700"
              >
                {t.common.search}
              </button>
            </div>
          </form>

          <div className="lg:col-span-2">
            <label htmlFor="dir-category" className="mb-1 block text-xs font-semibold text-earth-700">
              {t.search.category}
            </label>
            <select
              id="dir-category"
              value={selectedCategory?.slug ?? ""}
              onChange={(e) => pushFilters({ category: e.target.value || undefined })}
              className="h-10 w-full rounded-xl border border-earth-200 bg-earth-50/50 px-3 text-sm text-earth-900 focus:border-brand-500 focus:bg-white focus:outline-none"
            >
              <option value="">{t.search.allCategories}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name} ({c.artisanCount})
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="dir-country" className="mb-1 block text-xs font-semibold text-earth-700">
              {t.search.country}
            </label>
            <select
              id="dir-country"
              value={selectedCountry?.code ?? ""}
              onChange={(e) => pushFilters({ country: e.target.value || undefined, city: undefined })}
              className="h-10 w-full rounded-xl border border-earth-200 bg-earth-50/50 px-3 text-sm text-earth-900 focus:border-brand-500 focus:bg-white focus:outline-none"
            >
              <option value="">{t.search.allCountries}</option>
              {countries.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative lg:col-span-2">
            <label htmlFor="dir-city" className="mb-1 block text-xs font-semibold text-earth-700">
              {t.search.city}
            </label>
            <select
              id="dir-city"
              value={current.city ? String(current.city) : ""}
              onChange={(e) => pushFilters({ city: e.target.value || undefined })}
              disabled={!selectedCountry || loadingCities}
              className="h-10 w-full rounded-xl border border-earth-200 bg-earth-50/50 px-3 text-sm text-earth-900 focus:border-brand-500 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {!selectedCountry
                  ? t.search.selectCountryFirst
                  : loadingCities
                    ? t.search.loadingCities
                    : t.search.allCities}
              </option>
              {cities.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name} ({c.artisanCount})
                </option>
              ))}
            </select>
            {loadingCities && (
              <Loader2 className="pointer-events-none absolute bottom-2.5 right-8 h-4 w-4 animate-spin text-brand-600" />
            )}
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="dir-sort" className="mb-1 block text-xs font-semibold text-earth-700">
              {t.search.sort}
            </label>
            <select
              id="dir-sort"
              value={current.sort ?? "relevance"}
              onChange={(e) => {
                const v = e.target.value as ArtisanSort;
                pushFilters({ sort: v === "relevance" ? undefined : v });
              }}
              className="h-10 w-full rounded-xl border border-earth-200 bg-earth-50/50 px-3 text-sm text-earth-900 focus:border-brand-500 focus:bg-white focus:outline-none"
            >
              {ARTISAN_SORTS.map((s) => (
                <option key={s} value={s}>
                  {t.search.sorts[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-earth-100 pt-3">
          <button
            type="button"
            onClick={() => pushFilters({ featured: isFeatured ? undefined : "true" })}
            aria-pressed={isFeatured}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              isFeatured
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-earth-200 bg-earth-50 text-earth-700 hover:border-brand-300",
            )}
          >
            <Star className={clsx("h-3.5 w-3.5", isFeatured && "fill-current")} />
            {t.search.featuredOnly}
          </button>

          {isPending && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t.common.loading}
            </span>
          )}
        </div>
      </div>

      {activeBadges.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-earth-600">
            <Filter className="h-3.5 w-3.5" />
            {t.search.activeFilters}
          </span>
          {activeBadges.map((b) => (
            <span
              key={b.key}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800"
            >
              <span>{b.label}</span>
              <button
                type="button"
                onClick={b.onRemove}
                aria-label={fmt(t.search.removeFilter, { label: b.label })}
                className="rounded-full p-0.5 text-brand-700 hover:bg-brand-200/70"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-earth-700 underline-offset-2 hover:text-brand-700 hover:underline"
          >
            <RotateCcw className="h-3 w-3" />
            {t.search.clearAll}
          </button>
        </div>
      )}
    </section>
  );
}
