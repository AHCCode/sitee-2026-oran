"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <h1 className="font-display text-2xl font-bold text-earth-900">{t.common.error}</h1>
      <p className="mt-2 text-sm text-earth-600">{t.common.errorText}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <RotateCcw className="h-4 w-4" />
          {t.common.retry}
        </button>
        <Link
          href="/"
          className="rounded-xl border border-earth-200 bg-white px-4 py-2.5 text-sm font-semibold text-earth-800 hover:bg-earth-50"
        >
          {t.common.backHome}
        </Link>
      </div>
    </div>
  );
}
