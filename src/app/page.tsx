import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Globe2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { formatNumber, plural } from "@/lib/i18n";
import { getCategoriesWithCounts, getCountries, getPublicStats } from "@/lib/services/catalog";
import { getFeaturedArtisans } from "@/lib/services/artisans";
import { fmt } from "@/lib/text";
import { HomeSearchForm } from "@/components/HomeSearchForm";
import { ArtisanCard } from "@/components/ArtisanCard";
import { CategoryIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { locale, t } = await getI18n();
  const [categories, countries, featured, stats] = await Promise.all([
    getCategoriesWithCounts(locale),
    getCountries(locale),
    getFeaturedArtisans(locale, 6),
    getPublicStats(),
  ]);

  const popularCategories = categories.filter((c) => c.artisanCount > 0).slice(0, 6);

  return (
    <div>
      {/* Creative Asymmetric Bento Hero + Command-Bar Search Engine */}
      <section className="relative overflow-hidden bg-earth-900 pb-20 pt-10 text-white sm:pb-24 sm:pt-14">
        {/* Ambient Mesh Orbs + Architectural Grid */}
        <div className="bg-hero-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-1/4 h-96 w-96 rounded-full bg-forest-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            {/* Left Editorial Column */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-brand-200 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-forest-400" />
                </span>
                <span>{fmt(t.home.heroBadge, { count: stats.artisans })}</span>
              </div>

              <h1 className="mt-5 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
                {t.home.heroTitle}{" "}
                <span className="bg-gradient-to-r from-brand-300 via-indigo-200 to-forest-400 bg-clip-text text-transparent">
                  {t.home.heroHighlight}
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-earth-300 sm:text-base">
                {t.home.heroSubtitle}
              </p>

              {popularCategories.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-earth-400">{t.home.popular}</span>
                  {popularCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/artisans?category=${encodeURIComponent(cat.slug)}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-semibold text-earth-100 backdrop-blur-md transition hover:border-brand-400 hover:bg-brand-500/20 hover:text-white"
                    >
                      <CategoryIcon name={cat.icon} className="h-3 w-3 text-brand-300" />
                      <span>{cat.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Right Bento Photo Mosaic (Tablet & Desktop) */}
            <div className="hidden sm:grid sm:grid-cols-12 sm:gap-3.5 lg:col-span-5">
              <div className="group relative col-span-7 overflow-hidden rounded-3xl border border-white/15 bg-earth-800 shadow-2xl">
                <img
                  src="/images/seed/hero.jpg"
                  alt=""
                  className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-earth-900/90 via-transparent to-transparent" />
                <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/15 bg-black/45 p-3 backdrop-blur-md">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-forest-400">
                    Dakar · Abidjan · Oran
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-white">{t.common.tagline}</p>
                </div>
              </div>

              <div className="col-span-5 flex flex-col gap-3.5">
                <div className="group relative flex-1 overflow-hidden rounded-3xl border border-white/15 bg-earth-800 shadow-xl">
                  <img
                    src="/images/seed/menuiserie-2.jpg"
                    alt=""
                    className="h-28 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-earth-900/80 to-transparent" />
                  <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-earth-900">
                    Menuiserie
                  </span>
                </div>

                <div className="group relative flex-1 overflow-hidden rounded-3xl border border-white/15 bg-earth-800 shadow-xl">
                  <img
                    src="/images/seed/couture-2.jpg"
                    alt=""
                    className="h-28 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-earth-900/80 to-transparent" />
                  <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-earth-900">
                    Couture & Wax
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Command-Bar Search Engine */}
          <div className="mt-8 sm:mt-10">
            <HomeSearchForm categories={categories} countries={countries} />
          </div>
        </div>
      </section>

      {/* Floating Bento Platform Statistics (strictly consistent with DB) */}
      <section aria-label={t.home.statsTitle} className="relative z-20 -mt-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-earth-200/90 bg-white/95 p-4 shadow-xl shadow-earth-900/5 backdrop-blur-xl sm:p-6">
          <dl className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
            <div className="flex items-center gap-3.5 rounded-2xl bg-earth-50/90 p-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-sm">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <dd className="font-display text-2xl font-extrabold text-earth-900">
                  {formatNumber(stats.artisans, locale)}
                </dd>
                <dt className="text-xs font-medium text-earth-500">{t.home.stats.artisans}</dt>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl bg-earth-50/90 p-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <dd className="font-display text-2xl font-extrabold text-earth-900">
                  {formatNumber(stats.categories, locale)}
                </dd>
                <dt className="text-xs font-medium text-earth-500">{t.home.stats.categories}</dt>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl bg-earth-50/90 p-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 text-white shadow-sm">
                <Globe2 className="h-5 w-5" />
              </span>
              <div>
                <dd className="font-display text-2xl font-extrabold text-earth-900">
                  {formatNumber(stats.countries, locale)}
                </dd>
                <dt className="text-xs font-medium text-earth-500">{t.home.stats.countries}</dt>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl bg-earth-50/90 p-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <dd className="font-display text-2xl font-extrabold text-earth-900">
                  {formatNumber(stats.cities, locale)}
                </dd>
                <dt className="text-xs font-medium text-earth-500">{t.home.stats.cities}</dt>
              </div>
            </div>

            <div className="col-span-2 flex items-center gap-3.5 rounded-2xl bg-earth-50/90 p-3.5 sm:col-span-1">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-600 to-forest-500 text-white shadow-sm">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <dd className="font-display text-2xl font-extrabold text-earth-900">
                  {formatNumber(stats.quotes, locale)}
                </dd>
                <dt className="text-xs font-medium text-earth-500">{t.home.stats.quotes}</dt>
              </div>
            </div>
          </dl>
        </div>
      </section>

      {/* Clickable Bento Category Cards with Published Artisan Counts */}
      <section id="categories" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
              {t.nav.categories}
            </span>
            <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-earth-900 sm:text-3xl">
              {t.home.categoriesTitle}
            </h2>
            <p className="mt-1 text-sm text-earth-600">{t.home.categoriesSubtitle}</p>
          </div>
          <Link
            href="/artisans"
            className="inline-flex items-center gap-1.5 rounded-full border border-earth-200 bg-white px-4 py-2 text-xs font-bold text-earth-800 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
          >
            <span>{t.common.seeAll}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/artisans?category=${encodeURIComponent(cat.slug)}`}
              className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-earth-200/80 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-500/10"
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-all duration-200 group-hover:bg-gradient-to-br group-hover:from-brand-600 group-hover:to-indigo-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-brand-500/25">
                  <CategoryIcon name={cat.icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-display text-sm font-bold text-earth-900 group-hover:text-brand-600">
                    {cat.name}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-earth-500">
                    {plural(cat.artisanCount, t.common.artisanOne, t.common.artisanOther, locale)}
                  </p>
                </div>
              </div>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-earth-100 text-earth-500 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Artisans (Artisans à la une) */}
      <section className="relative overflow-hidden border-y border-earth-200/80 bg-gradient-to-b from-white via-brand-50/35 to-white py-14 sm:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                {t.artisan.featured}
              </span>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-earth-900 sm:text-3xl">
                {t.home.featuredTitle}
              </h2>
              <p className="mt-1 text-sm text-earth-600">{t.home.featuredSubtitle}</p>
            </div>
            <Link
              href="/artisans?featured=true"
              className="inline-flex items-center gap-1.5 rounded-full bg-earth-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-600"
            >
              <span>{t.common.seeAll}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="mt-8 rounded-3xl border border-earth-200 bg-white p-8 text-center text-sm text-earth-600">
              {t.home.featuredEmpty}
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((artisan) => (
                <ArtisanCard key={artisan.id} artisan={artisan} t={t} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works + Dark Mesh CTA */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
            01 · 02 · 03
          </span>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-earth-900 sm:text-3xl">
            {t.home.howTitle}
          </h2>
          <p className="mt-1 text-sm text-earth-600">{t.home.howSubtitle}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {t.home.steps.map((step, i) => (
            <div
              key={step.title}
              className="group relative overflow-hidden rounded-3xl border border-earth-200/80 bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-500 font-display text-sm font-extrabold text-white shadow-md shadow-brand-500/25">
                  0{i + 1}
                </span>
                <span className="font-display text-4xl font-extrabold text-earth-100 transition-colors group-hover:text-brand-100">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-5 font-display text-lg font-extrabold text-earth-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-earth-600">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-14 overflow-hidden rounded-3xl bg-earth-900 p-7 text-white shadow-2xl sm:p-10">
          <div className="bg-hero-grid pointer-events-none absolute inset-0 opacity-50" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-forest-500/20 blur-3xl" />

          <div className="relative flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="max-w-xl space-y-2 text-center sm:text-left">
              <h3 className="font-display text-2xl font-extrabold tracking-tight">
                {t.home.ctaTitle}
              </h3>
              <p className="text-sm leading-relaxed text-earth-300">{t.home.ctaText}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/artisans"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition hover:from-brand-600 hover:to-indigo-600"
              >
                <span>{t.nav.findArtisan}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <ShieldCheck className="h-4 w-4 text-forest-400" />
                <span>{t.nav.admin}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
