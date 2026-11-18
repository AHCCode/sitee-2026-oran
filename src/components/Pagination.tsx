import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import type { Dictionary } from "@/lib/i18n";
import { fmt } from "@/lib/text";

export function Pagination({
  page,
  totalPages,
  basePath,
  query,
  t,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  query: Record<string, string | number | undefined>;
  t: Dictionary;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(target: number) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "" && k !== "page") sp.set(k, String(v));
    }
    if (target > 1) sp.set("page", String(target));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const pages: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) {
    pages.push(p);
  }

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-earth-200 pt-6"
    >
      <p className="text-xs font-medium text-earth-600 sm:text-sm">
        {fmt(t.common.page, { page, total: totalPages })}
      </p>

      <div className="flex items-center gap-1.5">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-earth-200 bg-white px-3 py-1.5 text-xs font-semibold text-earth-800 hover:bg-earth-50 sm:text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t.common.previous}</span>
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-earth-200 bg-earth-50 px-3 py-1.5 text-xs font-semibold text-earth-400 sm:text-sm">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t.common.previous}</span>
          </span>
        )}

        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((p) => (
            <Link
              key={p}
              href={hrefFor(p)}
              aria-current={p === page ? "page" : undefined}
              className={clsx(
                "inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                p === page
                  ? "bg-brand-600 text-white"
                  : "border border-earth-200 bg-white text-earth-800 hover:bg-earth-50",
              )}
            >
              {p}
            </Link>
          ))}
        </div>

        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-earth-200 bg-white px-3 py-1.5 text-xs font-semibold text-earth-800 hover:bg-earth-50 sm:text-sm"
          >
            <span className="hidden sm:inline">{t.common.next}</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-earth-200 bg-earth-50 px-3 py-1.5 text-xs font-semibold text-earth-400 sm:text-sm">
            <span className="hidden sm:inline">{t.common.next}</span>
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </nav>
  );
}
