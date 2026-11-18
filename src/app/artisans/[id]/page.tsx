import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Star,
} from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { formatDate } from "@/lib/i18n";
import { getPublicArtisan } from "@/lib/services/artisans";
import { fmt } from "@/lib/text";
import { CategoryIcon } from "@/components/icons";
import { PhotoGallery } from "@/components/PhotoGallery";
import { QuoteRequestForm } from "@/components/QuoteRequestForm";
import { ArtisanCard } from "@/components/ArtisanCard";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ArtisanDetailPage({ params }: Props) {
  const { locale, t } = await getI18n();
  const { id } = await params;
  const artisan = await getPublicArtisan(id, locale);
  if (!artisan) notFound();

  const yearsLabel =
    artisan.yearsExperience === 1
      ? fmt(t.artisan.yearOne, { count: 1 })
      : fmt(t.artisan.years, { count: artisan.yearsExperience });

  const memberDate = formatDate(artisan.publishedAt ?? artisan.createdAt, locale);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs font-medium text-earth-600">
        <Link href="/" className="hover:text-brand-700">
          {t.nav.home}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-earth-400" />
        <Link href="/artisans" className="hover:text-brand-700">
          {t.artisan.breadcrumb}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-earth-400" />
        <Link
          href={`/artisans?category=${encodeURIComponent(artisan.category.slug)}`}
          className="hover:text-brand-700"
        >
          {artisan.category.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-earth-400" />
        <span className="truncate font-semibold text-earth-900">{artisan.fullName}</span>
      </nav>

      {/* Header card */}
      <div className="mb-8 rounded-2xl border border-earth-200 bg-white p-5 shadow-card sm:p-7">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/artisans?category=${encodeURIComponent(artisan.category.slug)}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100"
              >
                <CategoryIcon name={artisan.category.icon} className="h-3.5 w-3.5" />
                {artisan.category.name}
              </Link>
              {artisan.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                  <Star className="h-3 w-3 fill-current" />
                  {t.artisan.featured}
                </span>
              )}
            </div>

            <h1 className="font-display text-2xl font-bold text-earth-900 sm:text-3xl">
              {artisan.fullName}
            </h1>
            {artisan.businessName && (
              <p className="text-sm font-medium text-earth-600">{artisan.businessName}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-1 text-xs text-earth-700 sm:text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <MapPin className="h-4 w-4 text-brand-600" />
                {artisan.city.name}, {artisan.country.name}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Award className="h-4 w-4 text-brand-600" />
                {yearsLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 text-earth-500">
                <Calendar className="h-4 w-4" />
                {fmt(t.artisan.memberSince, { date: memberDate })}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <a
              href="#request-quote"
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              {t.artisan.requestQuote}
            </a>
          </div>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Photo Gallery + Bio + Services + Contact */}
        <div className="space-y-8 lg:col-span-7">
          <section aria-labelledby="gallery-heading">
            <h2 id="gallery-heading" className="mb-3 font-display text-lg font-bold text-earth-900">
              {t.artisan.gallery}
            </h2>
            <PhotoGallery artisanName={artisan.fullName} photos={artisan.photos} />
          </section>

          <section
            aria-labelledby="about-heading"
            className="rounded-2xl border border-earth-200 bg-white p-5 shadow-card sm:p-6"
          >
            <h2 id="about-heading" className="font-display text-lg font-bold text-earth-900">
              {t.artisan.about}
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-earth-700 sm:text-base">
              {artisan.bio}
            </p>
          </section>

          <section
            aria-labelledby="services-heading"
            className="rounded-2xl border border-earth-200 bg-white p-5 shadow-card sm:p-6"
          >
            <h2 id="services-heading" className="font-display text-lg font-bold text-earth-900">
              {t.artisan.services}
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {artisan.services.map((service) => (
                <li
                  key={service}
                  className="flex items-start gap-2.5 rounded-xl border border-earth-100 bg-earth-50/70 p-3 text-sm font-medium text-earth-800"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" />
                  <span>{service}</span>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="contact-heading"
            className="rounded-2xl border border-earth-200 bg-white p-5 shadow-card sm:p-6"
          >
            <h2 id="contact-heading" className="font-display text-lg font-bold text-earth-900">
              {t.artisan.contact}
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <dt className="text-xs font-semibold text-earth-500">{t.artisan.location}</dt>
                  <dd className="text-sm font-medium text-earth-900">
                    {artisan.city.name}, {artisan.country.name}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Phone className="h-4 w-4" />
                </span>
                <div>
                  <dt className="text-xs font-semibold text-earth-500">{t.artisan.phone}</dt>
                  <dd className="text-sm font-medium text-earth-900">
                    <a href={`tel:${artisan.phone}`} className="hover:text-brand-700">
                      {artisan.phone}
                    </a>
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Mail className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs font-semibold text-earth-500">{t.artisan.email}</dt>
                  <dd className="truncate text-sm font-medium text-earth-900">
                    <a href={`mailto:${artisan.email}`} className="hover:text-brand-700">
                      {artisan.email}
                    </a>
                  </dd>
                </div>
              </div>

              {artisan.website && (
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <ExternalLink className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-earth-500">{t.artisan.website}</dt>
                    <dd className="truncate text-sm font-medium text-brand-600">
                      <a
                        href={artisan.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {artisan.website.replace(/^https?:\/\//, "")}
                      </a>
                    </dd>
                  </div>
                </div>
              )}
            </dl>
          </section>
        </div>

        {/* Right: Sticky Quote Request Form */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-20">
            <QuoteRequestForm artisanId={artisan.id} artisanName={artisan.fullName} />
          </div>
        </div>
      </div>

      {/* Similar Artisans */}
      {artisan.similar.length > 0 && (
        <section aria-labelledby="similar-heading" className="mt-14 border-t border-earth-200 pt-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 id="similar-heading" className="font-display text-2xl font-bold text-earth-900">
              {t.artisan.similar}
            </h2>
            <Link
              href={`/artisans?category=${encodeURIComponent(artisan.category.slug)}`}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              {t.common.seeAll}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {artisan.similar.map((sim) => (
              <ArtisanCard key={sim.id} artisan={sim} t={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
