import Link from "next/link";
import { ArrowLeft, CheckCircle2, Compass, FileText } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { formatDateTime } from "@/lib/i18n";
import { getQuoteConfirmation } from "@/lib/services/quotes";
import { fmt } from "@/lib/text";
import { QuoteStatusBadge } from "@/components/icons";
import { CopyReferenceButton } from "@/components/CopyReferenceButton";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function QuoteConfirmationPage({ params, searchParams }: Props) {
  const { locale, t } = await getI18n();
  const { reference } = await params;
  const { t: token } = await searchParams;

  const quote = token ? await getQuoteConfirmation(reference, token, locale) : null;

  if (!quote) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-earth-200 text-earth-700">
          <FileText className="h-7 w-7" />
        </span>
        <h1 className="font-display text-2xl font-bold text-earth-900">
          {t.confirmation.notFoundTitle}
        </h1>
        <p className="mt-2 text-sm text-earth-600">{t.confirmation.notFoundText}</p>
        <Link
          href="/artisans"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Compass className="h-4 w-4" />
          <span>{t.confirmation.browseMore}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="overflow-hidden rounded-3xl border border-earth-200 bg-white shadow-card">
        {/* Top confirmation banner */}
        <div className="border-b border-earth-100 bg-gradient-to-br from-forest-50 via-brand-50/50 to-white px-6 py-8 text-center sm:px-10">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-500 text-white shadow-sm">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h1 className="font-display text-2xl font-bold text-earth-900 sm:text-3xl">
            {t.confirmation.title}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-earth-700">
            {fmt(t.confirmation.subtitle, { name: quote.clientName })}
          </p>

          {/* Reference Box */}
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-earth-500">
              {t.confirmation.reference}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-3">
              <span className="font-mono text-2xl font-bold tracking-tight text-brand-700">
                {quote.reference}
              </span>
              <CopyReferenceButton reference={quote.reference} />
            </div>
            <p className="mt-1.5 text-xs text-earth-500">{t.confirmation.keepRef}</p>
          </div>
        </div>

        {/* Request summary (Récapitulatif) */}
        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-earth-100 pb-3">
            <h2 className="font-display text-lg font-bold text-earth-900">
              {t.confirmation.summary}
            </h2>
            <QuoteStatusBadge status={quote.status} t={t} />
          </div>

          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-earth-50/80 p-3.5">
              <dt className="text-xs font-semibold text-earth-500">{t.confirmation.artisan}</dt>
              <dd className="mt-0.5 font-semibold text-earth-900">{quote.artisan.fullName}</dd>
              {quote.artisan.category && (
                <dd className="text-xs text-earth-600">
                  {quote.artisan.category}
                  {quote.artisan.location ? ` · ${quote.artisan.location}` : ""}
                </dd>
              )}
            </div>

            <div className="rounded-xl bg-earth-50/80 p-3.5">
              <dt className="text-xs font-semibold text-earth-500">{t.confirmation.date}</dt>
              <dd className="mt-0.5 font-semibold text-earth-900">
                {formatDateTime(quote.createdAt, locale)}
              </dd>
            </div>

            <div className="rounded-xl bg-earth-50/80 p-3.5">
              <dt className="text-xs font-semibold text-earth-500">{t.quote.clientName}</dt>
              <dd className="mt-0.5 font-medium text-earth-900">{quote.clientName}</dd>
              <dd className="text-xs text-earth-600">
                {quote.clientEmail} · {quote.clientPhone}
              </dd>
            </div>

            {quote.budget && (
              <div className="rounded-xl bg-earth-50/80 p-3.5">
                <dt className="text-xs font-semibold text-earth-500">{t.quote.budget}</dt>
                <dd className="mt-0.5 font-semibold text-earth-900">{quote.budget}</dd>
              </div>
            )}

            <div className="rounded-xl bg-earth-50/80 p-4 sm:col-span-2">
              <dt className="text-xs font-semibold text-earth-500">{t.quote.subject}</dt>
              <dd className="mt-0.5 font-semibold text-earth-900">{quote.subject}</dd>
              <dt className="mt-3 text-xs font-semibold text-earth-500">{t.quote.description}</dt>
              <dd className="mt-1 whitespace-pre-line text-sm leading-relaxed text-earth-700">
                {quote.description}
              </dd>
            </div>
          </dl>

          {/* Next steps */}
          <div className="rounded-2xl border border-earth-200 bg-earth-50/60 p-4 sm:p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-earth-700">
              {t.confirmation.nextSteps}
            </h3>
            <ol className="mt-3 space-y-2 text-xs text-earth-700 sm:text-sm">
              {t.confirmation.nextStepsList.map((step, i) => (
                <li key={step} className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Return links */}
          <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-earth-100 pt-4 sm:flex-row sm:items-center">
            {quote.artisan.id && quote.artisan.published ? (
              <Link
                href={`/artisans/${quote.artisan.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-earth-200 bg-white px-4 py-2.5 text-sm font-semibold text-earth-800 hover:bg-earth-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t.confirmation.backToArtisan}</span>
              </Link>
            ) : (
              <span />
            )}

            <Link
              href="/artisans"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              <Compass className="h-4 w-4" />
              <span>{t.confirmation.browseMore}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
