"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, MapPin, Search, Wrench } from "lucide-react";
import type { CategoryDTO, CityDTO, CountryDTO } from "@/lib/services/catalog";
import { useI18n } from "@/lib/i18n/client";

export function HomeSearchForm({
  categories,
  countries,
}: {
  categories: CategoryDTO[];
  countries: CountryDTO[];
}) {
  const { t } = useI18n();
  const router = useRouter();

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [cityId, setCityId] = useState("");
  const [cities, setCities] = useState<CityDTO[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    setCityId("");
    if (!countryCode) {
      setCities([]);
      return;
    }
    const selected = countries.find((c) => c.code === countryCode);
    if (!selected) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setLoadingCities(true);
    fetch(`/api/countries/${selected.id}/cities`)
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
  }, [countryCode, countries]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (category) sp.set("category", category);
    if (countryCode) sp.set("country", countryCode);
    if (cityId) sp.set("city", cityId);
    const qs = sp.toString();
    router.push(qs ? `/artisans?${qs}` : "/artisans");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl bg-white/95 p-2.5 shadow-2xl shadow-black/40 ring-1 ring-white/25 backdrop-blur-xl sm:p-3"
      aria-label={t.common.search}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-12">
        <div className="group relative rounded-2xl bg-earth-50/90 px-3.5 py-2 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/30 lg:col-span-4">
          <label
            htmlFor="home-q"
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-earth-500"
          >
            <Search className="h-3 w-3 text-brand-600" aria-hidden="true" />
            {t.search.keyword}
          </label>
          <input
            id="home-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.home.searchPlaceholder}
            className="mt-0.5 h-7 w-full bg-transparent text-sm font-medium text-earth-900 placeholder:text-earth-400 focus:outline-none"
          />
        </div>

        <div className="relative rounded-2xl bg-earth-50/90 px-3.5 py-2 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/30 lg:col-span-2">
          <label
            htmlFor="home-category"
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-earth-500"
          >
            <Wrench className="h-3 w-3 text-brand-600" aria-hidden="true" />
            {t.search.category}
          </label>
          <select
            id="home-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-0.5 h-7 w-full bg-transparent text-sm font-medium text-earth-900 focus:outline-none"
          >
            <option value="">{t.search.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name} ({c.artisanCount})
              </option>
            ))}
          </select>
        </div>

        <div className="relative rounded-2xl bg-earth-50/90 px-3.5 py-2 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/30 lg:col-span-2">
          <label
            htmlFor="home-country"
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-earth-500"
          >
            <MapPin className="h-3 w-3 text-brand-600" aria-hidden="true" />
            {t.search.country}
          </label>
          <select
            id="home-country"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="mt-0.5 h-7 w-full bg-transparent text-sm font-medium text-earth-900 focus:outline-none"
          >
            <option value="">{t.search.allCountries}</option>
            {countries.map((c) => (
              <option key={c.id} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative rounded-2xl bg-earth-50/90 px-3.5 py-2 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/30 lg:col-span-2">
          <label
            htmlFor="home-city"
            className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-earth-500"
          >
            <span>{t.search.city}</span>
            {loadingCities && <Loader2 className="h-3 w-3 animate-spin text-brand-600" />}
          </label>
          <select
            id="home-city"
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            disabled={!countryCode || loadingCities}
            className="mt-0.5 h-7 w-full bg-transparent text-sm font-medium text-earth-900 focus:outline-none disabled:cursor-not-allowed disabled:text-earth-400"
          >
            <option value="">
              {!countryCode
                ? t.search.selectCountryFirst
                : loadingCities
                  ? t.search.loadingCities
                  : t.search.allCities}
            </option>
            {cities.map((city) => (
              <option key={city.id} value={String(city.id)}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex sm:col-span-2 lg:col-span-2">
          <button
            type="submit"
            className="group inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-500 px-5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition-all hover:from-brand-700 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <span>{t.home.searchButton}</span>
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </form>
  );
}
