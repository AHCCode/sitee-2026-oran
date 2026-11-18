"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  Loader2,
  Mail,
  Phone,
  RotateCcw,
  Save,
  Search,
  Send,
  User,
  X,
} from "lucide-react";
import clsx from "clsx";
import { QUOTE_STATUSES, type QuoteEventType, type QuoteStatus } from "@/lib/constants";
import type { AdminQuoteDTO } from "@/lib/services/quotes";
import { useI18n } from "@/lib/i18n/client";
import { formatDate, formatDateTime } from "@/lib/i18n";
import { fmt } from "@/lib/text";
import { QuoteStatusBadge } from "@/components/icons";
import { Pagination } from "@/components/Pagination";

type QuoteRow = {
  id: string;
  reference: string;
  clientName: string;
  clientEmail: string;
  artisanId: string | null;
  artisanName: string;
  subject: string;
  status: string;
  forwardedToArtisan: boolean;
  createdAt: Date | string;
};

export function AdminQuotesClient({
  items,
  page,
  totalPages,
  statusCounts,
  filters,
  initialOpenId,
}: {
  items: QuoteRow[];
  total: number;
  page: number;
  totalPages: number;
  statusCounts: Record<QuoteStatus | "ALL", number>;
  filters: { status?: QuoteStatus | "ALL"; q?: string };
  initialOpenId?: string;
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(filters.q ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(initialOpenId ?? null);
  const [detail, setDetail] = useState<AdminQuoteDTO | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [notesDraft, setNotesDraft] = useState("");
  const [savingPatch, setSavingPatch] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    fetch(`/api/admin/quotes/${selectedId}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json?.data) {
          setDetail(json.data as AdminQuoteDTO);
          setNotesDraft((json.data as AdminQuoteDTO).internalNotes ?? "");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  function pushFilters(patch: Partial<{ status?: string; q?: string }>) {
    const next: Record<string, string | undefined> = {
      status: filters.status && filters.status !== "ALL" ? filters.status : undefined,
      q: filters.q,
      ...patch,
    };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (v !== undefined && v !== "" && v !== "ALL") sp.set(k, v);
    }
    const qs = sp.toString();
    startTransition(() => {
      router.push(qs ? `/admin/quotes?${qs}` : "/admin/quotes");
    });
  }

  async function patchDetail(payload: {
    status?: QuoteStatus;
    forwardedToArtisan?: boolean;
    internalNotes?: string;
  }) {
    if (!detail) return;
    setSavingPatch(true);
    try {
      const res = await fetch(`/api/admin/quotes/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.data) {
        const updated = json.data as AdminQuoteDTO;
        setDetail(updated);
        setNotesDraft(updated.internalNotes ?? "");
        showToast(t.admin.quotes.updated);
        router.refresh();
      }
    } finally {
      setSavingPatch(false);
    }
  }

  function formatEventLabel(ev: {
    type: QuoteEventType;
    fromStatus: QuoteStatus | null;
    toStatus: QuoteStatus | null;
  }) {
    if (ev.type === "STATUS_CHANGED") {
      return fmt(t.admin.quotes.events.STATUS_CHANGED, {
        from: ev.fromStatus ? t.quoteStatus[ev.fromStatus] : "—",
        to: ev.toStatus ? t.quoteStatus[ev.toStatus] : "—",
      });
    }
    return t.admin.quotes.events[ev.type] ?? ev.type;
  }

  const currentTab = filters.status ?? "ALL";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-earth-900 sm:text-3xl">
          {t.admin.quotes.title}
        </h1>
        <p className="mt-1 text-sm text-earth-600">{t.admin.quotes.subtitle}</p>
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

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-earth-200 pb-3">
        <button
          type="button"
          onClick={() => pushFilters({ status: undefined })}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition",
            currentTab === "ALL"
              ? "bg-brand-600 text-white shadow-sm"
              : "bg-white text-earth-700 hover:bg-earth-100",
          )}
        >
          <span>{t.admin.quotes.tabAll}</span>
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-[11px]",
              currentTab === "ALL" ? "bg-white/20 text-white" : "bg-earth-100 text-earth-700",
            )}
          >
            {statusCounts.ALL ?? 0}
          </span>
        </button>

        {QUOTE_STATUSES.map((st) => {
          const active = currentTab === st;
          return (
            <button
              key={st}
              type="button"
              onClick={() => pushFilters({ status: st })}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition",
                active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white text-earth-700 hover:bg-earth-100",
              )}
            >
              <span>{t.quoteStatus[st]}</span>
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

      {/* Search bar */}
      <div className="rounded-2xl border border-earth-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              pushFilters({ q: q.trim() || undefined });
            }}
            className="flex flex-1"
          >
            <div className="relative flex w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-400" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.admin.quotes.searchPlaceholder}
                className="h-10 w-full rounded-l-xl border border-earth-200 bg-earth-50/50 pl-9 pr-3 text-sm text-earth-900 focus:border-brand-500 focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-r-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-700"
              >
                {t.common.search}
              </button>
            </div>
          </form>

          {(filters.q || (filters.status && filters.status !== "ALL")) && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                startTransition(() => router.push("/admin/quotes"));
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-earth-200 px-3 text-xs font-semibold text-earth-700 hover:bg-earth-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t.common.reset}</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-earth-200 bg-white shadow-card">
        {items.length === 0 ? (
          <div className="p-12 text-center text-sm text-earth-600">{t.admin.quotes.empty}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-earth-200 text-left text-sm">
              <thead className="bg-earth-50/80 text-xs font-semibold uppercase tracking-wider text-earth-600">
                <tr>
                  <th className="px-4 py-3 sm:px-6">{t.admin.table.reference}</th>
                  <th className="px-4 py-3">{t.admin.table.client}</th>
                  <th className="px-4 py-3">{t.admin.table.artisan}</th>
                  <th className="px-4 py-3">{t.admin.quotes.project}</th>
                  <th className="px-4 py-3">{t.admin.table.status}</th>
                  <th className="px-4 py-3">{t.admin.table.forwarded}</th>
                  <th className="px-4 py-3">{t.admin.table.date}</th>
                  <th className="px-4 py-3 text-right sm:px-6">{t.admin.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-100 bg-white">
                {items.map((row) => {
                  const isSelected = selectedId === row.id;
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedId(row.id)}
                      className={clsx(
                        "cursor-pointer transition-colors hover:bg-brand-50/40",
                        isSelected && "bg-brand-50/70",
                      )}
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs font-bold text-brand-700 sm:px-6">
                        {row.reference}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-earth-900">{row.clientName}</p>
                        <p className="text-xs text-earth-500">{row.clientEmail}</p>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-earth-800">{row.artisanName}</td>
                      <td className="max-w-xs truncate px-4 py-3.5 text-xs text-earth-700">
                        {row.subject}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <QuoteStatusBadge status={row.status as QuoteStatus} t={t} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs">
                        {row.forwardedToArtisan ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-indigo-700">
                            <Send className="h-3.5 w-3.5" />
                            {t.common.yes}
                          </span>
                        ) : (
                          <span className="text-earth-400">{t.common.no}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-earth-500">
                        {formatDate(row.createdAt, locale)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-6">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(row.id);
                          }}
                          aria-label={fmt(t.admin.quotes.openDetail, { ref: row.reference })}
                          className="rounded-lg border border-earth-200 bg-white px-2.5 py-1 text-xs font-semibold text-earth-800 hover:bg-earth-100"
                        >
                          {t.common.view}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/quotes"
        query={{
          status: filters.status && filters.status !== "ALL" ? filters.status : undefined,
          q: filters.q,
        }}
        t={t}
      />

      {/* Detail Side-Panel (Volet détail) */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/50 animate-fade-in"
            onClick={() => setSelectedId(null)}
            aria-hidden="true"
          />

          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl animate-slide-in">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-earth-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-earth-500">
                  {t.admin.quotes.detailTitle}
                </p>
                <h2 className="font-mono text-lg font-bold text-brand-700">
                  {detail?.reference ?? "…"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label={t.common.close}
                className="rounded-xl border border-earth-200 p-2 text-earth-600 hover:bg-earth-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetail || !detail ? (
              <div className="flex flex-1 items-center justify-center p-12">
                <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
              </div>
            ) : (
              <div className="space-y-6 p-5 sm:p-6">
                {/* Status + Transmise à l'artisan controls */}
                <div className="rounded-2xl border border-earth-200 bg-earth-50/70 p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-earth-600">
                      {t.admin.quotes.receivedOn} {formatDateTime(detail.createdAt, locale)}
                    </span>
                    <QuoteStatusBadge status={detail.status} t={t} />
                  </div>

                  <div>
                    <label
                      htmlFor="drawer-status"
                      className="mb-1 block text-xs font-semibold text-earth-800"
                    >
                      {t.admin.quotes.changeStatus}
                    </label>
                    <select
                      id="drawer-status"
                      value={detail.status}
                      disabled={savingPatch}
                      onChange={(e) =>
                        void patchDetail({ status: e.target.value as QuoteStatus })
                      }
                      className="h-10 w-full rounded-xl border border-earth-200 bg-white px-3 text-sm font-semibold text-earth-900 focus:border-brand-500 focus:outline-none"
                    >
                      {QUOTE_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {t.quoteStatus[st]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Transmise à l'artisan toggle */}
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-earth-200 bg-white p-3.5">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-xs font-bold text-earth-900">
                        <Send className="h-3.5 w-3.5 text-indigo-600" />
                        <span>{t.admin.quotes.forwarded}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-earth-500">
                        {detail.forwardedToArtisan && detail.forwardedAt
                          ? fmt(t.admin.quotes.forwardedOn, {
                              date: formatDateTime(detail.forwardedAt, locale),
                            })
                          : t.admin.quotes.notForwarded}
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={detail.forwardedToArtisan}
                      disabled={savingPatch}
                      onClick={() =>
                        void patchDetail({ forwardedToArtisan: !detail.forwardedToArtisan })
                      }
                      className={clsx(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none",
                        detail.forwardedToArtisan ? "bg-indigo-600" : "bg-earth-300",
                      )}
                    >
                      <span
                        className={clsx(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
                          detail.forwardedToArtisan ? "translate-x-5" : "translate-x-0",
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* Client & Artisan cards */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div className="rounded-2xl border border-earth-200 p-4">
                    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-earth-500">
                      <User className="h-3.5 w-3.5 text-brand-600" />
                      {t.admin.quotes.client}
                    </h3>
                    <p className="mt-2 font-semibold text-earth-900">{detail.clientName}</p>
                    <div className="mt-2 space-y-1 text-xs text-earth-700">
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-earth-400" />
                        <a href={`mailto:${detail.clientEmail}`} className="truncate hover:text-brand-700">
                          {detail.clientEmail}
                        </a>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-earth-400" />
                        <a href={`tel:${detail.clientPhone}`} className="hover:text-brand-700">
                          {detail.clientPhone}
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-earth-200 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-earth-500">
                      {t.admin.table.artisan}
                    </h3>
                    <p className="mt-2 font-semibold text-earth-900">{detail.artisanName}</p>
                    {detail.artisan ? (
                      <div className="mt-1 space-y-1 text-xs text-earth-600">
                        <p>
                          {detail.artisan.category} · {detail.artisan.location}
                        </p>
                        <p>{detail.artisan.phone}</p>
                        <Link
                          href={`/admin/artisans/${detail.artisan.id}/edit`}
                          className="mt-1 inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline"
                        >
                          <span>{t.common.edit}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs italic text-earth-400">
                        {t.admin.quotes.artisanDeleted}
                      </p>
                    )}
                  </div>
                </div>

                {/* Project details */}
                <div className="rounded-2xl border border-earth-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-earth-500">
                      {t.admin.quotes.project}
                    </h3>
                    {detail.budget && (
                      <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-800">
                        {t.admin.quotes.budget} : {detail.budget}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-semibold text-earth-900">{detail.subject}</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-earth-700">
                    {detail.description}
                  </p>
                </div>

                {/* Internal notes */}
                <div className="rounded-2xl border border-earth-200 p-4">
                  <label
                    htmlFor="drawer-notes"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-earth-600"
                  >
                    {t.admin.quotes.notes}
                  </label>
                  <textarea
                    id="drawer-notes"
                    rows={3}
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder={t.admin.quotes.notesPlaceholder}
                    className="w-full rounded-xl border border-earth-200 bg-earth-50/50 p-3 text-sm text-earth-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                  <div className="mt-2.5 flex justify-end">
                    <button
                      type="button"
                      disabled={savingPatch || notesDraft.trim() === detail.internalNotes}
                      onClick={() => void patchDetail({ internalNotes: notesDraft })}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingPatch ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      <span>{t.admin.quotes.saveNotes}</span>
                    </button>
                  </div>
                </div>

                {/* Status History Log */}
                <div className="rounded-2xl border border-earth-200 p-4">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-earth-600">
                    <History className="h-3.5 w-3.5 text-brand-600" />
                    <span>{t.admin.quotes.history}</span>
                  </h3>

                  <ol className="mt-3 space-y-3 border-l-2 border-earth-200 pl-4">
                    {detail.history.map((ev) => (
                      <li key={ev.id} className="relative text-xs">
                        <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-600 ring-4 ring-white" />
                        <p className="font-semibold text-earth-900">{formatEventLabel(ev)}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-earth-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatDateTime(ev.createdAt, locale)}</span>
                          <span>·</span>
                          <span>
                            {ev.userName
                              ? fmt(t.admin.quotes.by, { name: ev.userName })
                              : t.admin.quotes.system}
                          </span>
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
