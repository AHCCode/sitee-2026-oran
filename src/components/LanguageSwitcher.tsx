"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import clsx from "clsx";
import { LOCALE_COOKIE, type Locale } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/client";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setLocale(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${365 * 86400}; SameSite=Lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={t.common.language}
      className={clsx(
        "inline-flex items-center rounded-full border border-earth-200 bg-earth-50 p-0.5 text-xs font-semibold",
        pending && "opacity-70",
      )}
    >
      {!compact && <Globe className="ml-2 mr-1 h-3.5 w-3.5 text-earth-600" aria-hidden="true" />}
      {(["fr", "en"] as const).map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={active}
            className={clsx(
              "rounded-full px-2.5 py-1 uppercase transition-colors",
              active
                ? "bg-brand-600 text-white shadow-sm"
                : "text-earth-700 hover:text-earth-900",
            )}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
