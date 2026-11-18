"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Eye,
  Loader2,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import clsx from "clsx";
import { ARTISAN_STATUSES, type ArtisanStatus } from "@/lib/constants";
import type { CategoryDTO, CountryDTO } from "@/lib/services/catalog";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n";
import { fmt, initials } from "@/lib/text";
import { ArtisanStatusBadge, CategoryIcon } from "@/components/icons";
import { Pagination } from "@/components/Pagination";

type AdminArtisanRow = {
  id: string;
  fullName: string;
  businessName: string | null;
  email: string;
  phone: string;
  status: ArtisanStatus;
  featured: boolean;
  coverUrl: string | null;
  category: { id: number; name: string; icon: string };
  country: { id: number; code: string; name: string };
  city: { id: number; name: string };
  quoteCount: number;
  updatedAt: Date | string;
};

export function AdminArtisansClient({
  items,
  total,
  page,
  totalPages,
  statusCounts,
  categories,
  countries,
  filters,
}: {
  items: AdminArtisanRow[];
  total: number;
  page: number;
  totalPages: number;
  statusCounts: Record<ArtisanStatus, number>;
  categories: CategoryDTO[];
  countries: CountryDTO[];
  filters: { q?: string; category?: number; country?: number; status?: ArtisanStatus };
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(filters.q ?? "");
  const [deleteTarget, setDeleteTarget] = useState<AdminArtisanRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewTarget, setViewTarget] = useState<AdminArtisanRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const totalAllStatuses =
    (statusCounts.PUBLISHED ?? 0) + (statusCounts.DRAFT ?? 0) + (statusCounts.ARCHIVED ?? 0);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function updateFilters(patch: Partial<{ q?: string; category?: string; country?: string; status?: string }>) {
    const next: Record<string, string | undefined> = {
      q: filters.q,
      category: filters.category ? String(filters.category) : undefined,
      country: filters.country ? String(filters.country) : undefined,
      status: filters.status,
      ...patch,
    };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (v !== undefined && v !== "") sp.set(k, v);
    }
    const qs = sp.toString();
    startTransition(() => {
      router.push(qs ? `/admin/artisans?${qs}` : "/admin/artisans");
    });
  }

  async function togglePublish(row: AdminArtisanRow) {
    const nextStatus: ArtisanStatus = row.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/artisans/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        showToast(t.admin.artisans.statusUpdated);
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/artisans/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteTarget(null);
        showToast(t.admin.artisans.deleted);
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-earth-900 sm:text-3xl">
            {t.admin.artisans.title}
          </h1>
          <p className="mt-1 text-sm text-earth-600">{t.admin.artisans.subtitle}</p>
        </div>

        <Link
          href="/admin/artisans/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          <span>{t.admin.artisans.new}</span>
        </Link>
      </div>

      {toast && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-earth-200 pb-3">
        <button
          type="button"
          onClick={() => updateFilters({ status: undefined })}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition",
            !filters.status
              ? "bg-brand-600 text-white shadow-sm"
              : "bg-white text-earth-700 hover:bg-earth-100",
          )}
        >
          <span>{t.admin.artisans.allStatuses}</span>
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-[11px]",
              !filters.status ? "bg-white/20 text-white" : "bg-earth-100 text-earth-700",
            )}
          >
            {totalAllStatuses}
          </span>
        </button>

        {ARTISAN_STATUSES.map((st) => {
          const active = filters.status === st;
          return (
            <button
              key={st}
              type="button"
              onClick={() => updateFilters({ status: st })}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition",
                active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white text-earth-700 hover:bg-earth-100",
              )}
            >
              <span>{t.artisanStatus[st]}</span>
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-[11px]",
                  active ? "bg-white/20 text-white" : "bg-earth-100 text-earth-700",
                )}
              >
                {statusCounts[st] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters bar */}
      <div className="rounded-2xl border border-earth-200 bg-white p-4 shadow-card">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateFilters({ q: q.trim() || undefined });
            }}
            className="sm:col-span-2 lg:col-span-5"
          >
            <div className="relative flex">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-400" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.admin.artisans.searchPlaceholder}
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

          <div className="lg:col-span-3">
            <select
              aria-label={t.search.category}
              value={filters.category ? String(filters.category) : ""}
              onChange={(e) => updateFilters({ category: e.target.value || undefined })}
              className="h-10 w-full rounded-xl border border-earth-200 bg-earth-50/50 px-3 text-sm text-earth-900 focus:border-brand-500 focus:bg-white focus:outline-none"
            >
              <option value="">{t.search.allCategories}</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              aria-label={t.search.country}
              value={filters.country ? String(filters.country) : ""}
              onChange={(e) => updateFilters({ country: e.target.value || undefined })}
              className="h-10 w-full rounded-xl border border-earth-200 bg-earth-50/50 px-3 text-sm text-earth-900 focus:border-brand-500 focus:bg-white focus:outline-none"
            >
              <option value="">{t.search.allCountries}</option>
              {countries.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end lg:col-span-1">
            {(filters.q || filters.category || filters.country || filters.status) && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  startTransition(() => router.push("/admin/artisans"));
                }}
                title={t.common.reset}
                className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-xl border border-earth-200 px-3 text-xs font-semibold text-earth-700 hover:bg-earth-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="lg:hidden">{t.common.reset}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-earth-200 bg-white shadow-card">
        {items.length === 0 ? (
          <div className="p-12 text-center text-sm text-earth-600">{t.admin.artisans.empty}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-earth-200 text-left text-sm">
              <thead className="bg-earth-50/80 text-xs font-semibold uppercase tracking-wider text-earth-600">
                <tr>
                  <th className="px-4 py-3 sm:px-6">{t.admin.table.name}</th>
                  <th className="px-4 py-3">{t.admin.table.category}</th>
                  <th className="px-4 py-3">{t.admin.table.location}</th>
                  <th className="px-4 py-3">{t.admin.table.status}</th>
                  <th className="px-4 py-3">{t.admin.artisans.quotesCount}</th>
                  <th className="px-4 py-3">{t.admin.table.updated}</th>
                  <th className="px-4 py-3 text-right sm:px-6">{t.admin.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-100 bg-white">
                {items.map((a) => (
                  <tr key={a.id} className="hover:bg-earth-50/60">
                    <td className="px-4 py-3.5 sm:px-6">
                      <div className="flex items-center gap-3">
                        {a.coverUrl ? (
                          <img
                            src={a.coverUrl}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 font-display text-xs font-bold text-brand-700">
                            {initials(a.fullName)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-semibold text-earth-900">{a.fullName}</p>
                            {a.featured && (
                              <span title={t.artisan.featured} className="inline-flex">
                                <Star className="h-3.5 w-3.5 shrink-0 fill-brand-500 text-brand-500" />
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-earth-500">
                            {a.businessName ?? a.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-earth-800">
                      <span className="inline-flex items-center gap-1.5">
                        <CategoryIcon name={a.category.icon} className="h-3.5 w-3.5 text-brand-600" />
                        {a.category.name}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-earth-700">
                      {a.city.name}, {a.country.name}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5">
                      <ArtisanStatusBadge status={a.status} t={t} />
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold text-earth-700">
                      {a.quoteCount}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-earth-500">
                      {formatDate(a.updatedAt, locale)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-6">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => togglePublish(a)}
                          disabled={busyId === a.id || isPending}
                          className="rounded-lg border border-earth-200 px-2.5 py-1 text-xs font-semibold text-earth-700 hover:bg-earth-100 disabled:opacity-50"
                        >
                          {busyId === a.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : a.status === "PUBLISHED" ? (
                            t.admin.artisans.unpublish
                          ) : (
                            t.admin.artisans.publish
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setViewTarget(a)}
                          title={t.common.view}
                          aria-label={`${t.common.view} ${a.fullName}`}
                          className="rounded-lg border border-earth-200 p-1.5 text-earth-700 hover:bg-earth-100"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <Link
                          href={`/admin/artisans/${a.id}/edit`}
                          title={t.common.edit}
                          aria-label={`${t.common.edit} ${a.fullName}`}
                          className="rounded-lg border border-earth-200 p-1.5 text-earth-700 hover:bg-earth-100"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(a)}
                          title={t.common.delete}
                          aria-label={`${t.common.delete} ${a.fullName}`}
                          className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/artisans"
        query={{
          q: filters.q,
          category: filters.category,
          country: filters.country,
          status: filters.status,
        }}
        t={t}
      />

      {/* Quick View Modal */}
      {viewTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-earth-100 pb-4">
              <div className="flex items-center gap-3">
                {viewTarget.coverUrl ? (
                  <img
                    src={viewTarget.coverUrl}
                    alt=""
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 font-display text-lg font-bold text-brand-700">
                    {initials(viewTarget.fullName)}
                  </span>
                )}
                <div>
                  <h2 className="font-display text-xl font-bold text-earth-900">
                    {viewTarget.fullName}
                  </h2>
                  {viewTarget.businessName && (
                    <p className="text-xs text-earth-600">{viewTarget.businessName}</p>
                  )}
                  <div className="mt-1">
                    <ArtisanStatusBadge status={viewTarget.status} t={t} />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewTarget(null)}
                className="rounded-lg p-1 text-earth-500 hover:bg-earth-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div className="rounded-xl bg-earth-50 p-3">
                <dt className="font-semibold text-earth-500">{t.admin.table.category}</dt>
                <dd className="mt-0.5 font-semibold text-earth-900">{viewTarget.category.name}</dd>
              </div>
              <div className="rounded-xl bg-earth-50 p-3">
                <dt className="font-semibold text-earth-500">{t.admin.table.location}</dt>
                <dd className="mt-0.5 flex items-center gap-1 font-semibold text-earth-900">
                  <MapPin className="h-3.5 w-3.5 text-brand-600" />
                  {viewTarget.city.name}, {viewTarget.country.name}
                </dd>
              </div>
              <div className="rounded-xl bg-earth-50 p-3">
                <dt className="font-semibold text-earth-500">{t.artisan.email}</dt>
                <dd className="mt-0.5 truncate font-medium text-earth-900">{viewTarget.email}</dd>
              </div>
              <div className="rounded-xl bg-earth-50 p-3">
                <dt className="font-semibold text-earth-500">{t.artisan.phone}</dt>
                <dd className="mt-0.5 font-medium text-earth-900">{viewTarget.phone}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-earth-100 pt-4">
              {viewTarget.status === "PUBLISHED" && (
                <Link
                  href={`/artisans/${viewTarget.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-earth-200 px-3.5 py-2 text-xs font-semibold text-earth-800 hover:bg-earth-50"
                >
                  <span>{t.admin.artisans.viewPublic}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              )}
              <Link
                href={`/admin/artisans/${viewTarget.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{t.common.edit}</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-earth-900">
                  {t.admin.artisans.deleteTitle}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-earth-600 sm:text-sm">
                  {fmt(t.admin.artisans.deleteText, { name: deleteTarget.fullName })}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-xl border border-earth-200 px-4 py-2 text-xs font-semibold text-earth-800 hover:bg-earth-50"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span>{deleting ? t.admin.artisans.deleting : t.admin.artisans.deleteConfirm}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
