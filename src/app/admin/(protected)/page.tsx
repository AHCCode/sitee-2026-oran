import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Globe2,
  Plus,
  Send,
  Users,
} from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { formatDate, formatNumber } from "@/lib/i18n";
import { getAdminStats } from "@/lib/services/stats";
import { fmt } from "@/lib/text";
import { QuoteStatusBadge } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { locale, t } = await getI18n();
  const stats = await getAdminStats(locale);

  const maxMonthly = Math.max(1, ...stats.monthly.map((m) => m.count));
  const maxCountryArtisans = Math.max(1, ...stats.byCountry.map((c) => Math.max(c.artisans, c.quotes)));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-earth-900 sm:text-3xl">
            {t.admin.dashboard.title}
          </h1>
          <p className="mt-1 text-sm text-earth-600">{t.admin.dashboard.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/artisans/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>{t.admin.artisans.new}</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <section aria-label="KPIs" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-earth-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-earth-500">
              {t.admin.dashboard.kpi.totalArtisans}
            </p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Users className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-earth-900">
            {formatNumber(stats.kpis.totalArtisans, locale)}
          </p>
          <p className="mt-1 text-xs font-medium text-earth-600">
            {fmt(t.admin.dashboard.publishedHint, { count: stats.kpis.publishedArtisans })}
          </p>
        </div>

        <div className="rounded-2xl border border-earth-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-earth-500">
              {t.admin.dashboard.kpi.totalQuotes}
            </p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <FileSpreadsheet className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-earth-900">
            {formatNumber(stats.kpis.totalQuotes, locale)}
          </p>
          <p className="mt-1 text-xs font-medium text-earth-600">
            {fmt(t.admin.dashboard.thisMonth, { count: stats.kpis.quotesThisMonth })}
          </p>
        </div>

        <div className="rounded-2xl border border-earth-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-earth-500">
              {t.admin.dashboard.kpi.pending}
            </p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-earth-900">
            {formatNumber(stats.kpis.pendingQuotes, locale)}
          </p>
          <p className="mt-1 text-xs font-medium text-amber-700">
            {t.admin.dashboard.pendingHint}
          </p>
        </div>

        <div className="rounded-2xl border border-earth-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-earth-500">
              {t.admin.dashboard.kpi.processed}
            </p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-earth-900">
            {formatNumber(stats.kpis.processedQuotes, locale)}
          </p>
          <p className="mt-1 text-xs font-medium text-emerald-700">
            {fmt(t.admin.dashboard.processedHint, { rate: stats.kpis.processingRate })}
          </p>
        </div>
      </section>

      {/* Charts row: Monthly Quote Requests + Distribution by Country */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Monthly quote requests chart */}
        <div className="rounded-2xl border border-earth-200 bg-white p-5 shadow-card sm:p-6 lg:col-span-7">
          <div className="mb-6 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-earth-900">
                {t.admin.dashboard.monthlyTitle}
              </h2>
              <p className="text-xs text-earth-500">{t.admin.dashboard.monthlySubtitle}</p>
            </div>
            <BarChart3 className="h-5 w-5 text-brand-600" />
          </div>

          <div className="grid h-56 grid-cols-12 items-end gap-1.5 pt-6 sm:gap-2.5">
            {stats.monthly.map((m) => {
              const pct = m.count === 0 ? 4 : Math.max(14, Math.round((m.count / maxMonthly) * 100));
              return (
                <div key={m.month} className="flex h-full flex-col items-center justify-end gap-1.5">
                  <span className="text-[11px] font-bold text-earth-700">{m.count}</span>
                  <div className="flex h-36 w-full items-end justify-center rounded-lg bg-earth-100/70 p-0.5">
                    <div
                      style={{ height: `${pct}%` }}
                      title={`${m.label}: ${m.count}`}
                      className={
                        m.count > 0
                          ? "w-full rounded-md bg-gradient-to-t from-brand-600 to-brand-400 transition-all"
                          : "w-full rounded-md bg-earth-200"
                      }
                    />
                  </div>
                  <span className="truncate text-[10px] font-medium text-earth-500">{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribution by country */}
        <div className="rounded-2xl border border-earth-200 bg-white p-5 shadow-card sm:p-6 lg:col-span-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-earth-900">
                {t.admin.dashboard.countryTitle}
              </h2>
              <p className="text-xs text-earth-500">{t.admin.dashboard.countrySubtitle}</p>
            </div>
            <Globe2 className="h-5 w-5 text-brand-600" />
          </div>

          <div className="mb-3 flex items-center gap-4 text-xs font-medium text-earth-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
              {t.admin.dashboard.artisansLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-earth-700" />
              {t.admin.dashboard.quotesLabel}
            </span>
          </div>

          <ul className="space-y-3">
            {stats.byCountry.map((c) => {
              const artPct = Math.max(6, Math.round((c.artisans / maxCountryArtisans) * 100));
              const qtPct = c.quotes ? Math.max(6, Math.round((c.quotes / maxCountryArtisans) * 100)) : 0;
              return (
                <li key={c.countryId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-earth-900">
                      {c.name}{" "}
                      <span className="font-mono text-[10px] text-earth-400">({c.code})</span>
                    </span>
                    <span className="text-earth-600">
                      <strong className="text-brand-700">{c.artisans}</strong> ·{" "}
                      <strong className="text-earth-800">{c.quotes}</strong>
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-earth-100">
                      <div
                        style={{ width: `${artPct}%` }}
                        className="h-full rounded-full bg-brand-600"
                      />
                    </div>
                    {qtPct > 0 && (
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-earth-100">
                        <div
                          style={{ width: `${qtPct}%` }}
                          className="h-full rounded-full bg-earth-700"
                        />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Latest Quote Requests Table */}
      <section className="rounded-2xl border border-earth-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-earth-100 px-5 py-4 sm:px-6">
          <h2 className="font-display text-lg font-bold text-earth-900">
            {t.admin.dashboard.latestTitle}
          </h2>
          <Link
            href="/admin/quotes"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 sm:text-sm"
          >
            <span>{t.admin.dashboard.viewAll}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-earth-200 text-left text-sm">
            <thead className="bg-earth-50/80 text-xs font-semibold uppercase tracking-wider text-earth-600">
              <tr>
                <th className="px-4 py-3 sm:px-6">{t.admin.table.reference}</th>
                <th className="px-4 py-3">{t.admin.table.client}</th>
                <th className="px-4 py-3">{t.admin.table.artisan}</th>
                <th className="px-4 py-3">{t.admin.table.status}</th>
                <th className="px-4 py-3">{t.admin.table.forwarded}</th>
                <th className="px-4 py-3">{t.admin.table.date}</th>
                <th className="px-4 py-3 text-right sm:px-6">{t.admin.table.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-100 bg-white">
              {stats.latest.map((q) => (
                <tr key={q.id} className="hover:bg-earth-50/60">
                  <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs font-bold text-brand-700 sm:px-6">
                    {q.reference}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-earth-900">{q.clientName}</td>
                  <td className="px-4 py-3.5 text-earth-700">{q.artisanName}</td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <QuoteStatusBadge status={q.status} t={t} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs">
                    {q.forwardedToArtisan ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-indigo-700">
                        <Send className="h-3.5 w-3.5" />
                        {t.common.yes}
                      </span>
                    ) : (
                      <span className="text-earth-400">{t.common.no}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs text-earth-600">
                    {formatDate(q.createdAt, locale)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-6">
                    <Link
                      href={`/admin/quotes?open=${encodeURIComponent(q.id)}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-earth-200 px-2.5 py-1 text-xs font-semibold text-earth-800 hover:bg-earth-100"
                    >
                      {t.common.view}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
