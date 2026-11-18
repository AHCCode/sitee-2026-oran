import Link from "next/link";
import { Compass } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFoundPage() {
  const { t } = await getI18n();

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <span className="mb-3 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700">
        404
      </span>
      <h1 className="font-display text-3xl font-bold text-earth-900">{t.common.notFoundTitle}</h1>
      <p className="mt-2 text-sm text-earth-600">{t.common.notFoundText}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {t.common.backHome}
        </Link>
        <Link
          href="/artisans"
          className="inline-flex items-center gap-2 rounded-xl border border-earth-200 bg-white px-5 py-2.5 text-sm font-semibold text-earth-800 hover:bg-earth-50"
        >
          <Compass className="h-4 w-4" />
          {t.nav.findArtisan}
        </Link>
      </div>
    </div>
  );
}
