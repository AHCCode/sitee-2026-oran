"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Menu, ShieldCheck, Sparkles, X } from "lucide-react";
import clsx from "clsx";
import { useI18n } from "@/lib/i18n/client";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/admin")) return null;

  const links = [
    { href: "/", label: t.nav.home, active: pathname === "/" },
    { href: "/artisans", label: t.nav.artisans, active: pathname.startsWith("/artisans") },
    { href: "/#categories", label: t.nav.categories, active: false },
    { href: "/#how-it-works", label: t.nav.howItWorks, active: false },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-earth-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3 focus:outline-none">
          <img
            src="/images/logo.png"
            alt="AFRIMÉTIERS HUB"
            className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-md transition-transform duration-200 group-hover:scale-105"
          />
          <span className="flex flex-col">
            <span className="font-display text-base font-extrabold tracking-tight text-earth-900 sm:text-lg">
              AFRIMÉTIERS{" "}
              <span className="bg-gradient-to-r from-brand-600 to-forest-600 bg-clip-text text-transparent">
                HUB
              </span>
            </span>
            <span className="hidden text-[11px] font-medium text-earth-500 sm:block">
              {t.common.tagline}
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 rounded-full border border-earth-200/80 bg-earth-100/70 p-1 md:flex"
          aria-label="Main"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                l.active
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-earth-600 hover:text-earth-900",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <LanguageSwitcher />
          <Link
            href="/admin"
            className="hidden items-center gap-1.5 rounded-full border border-earth-200 bg-white px-3.5 py-2 text-xs font-semibold text-earth-700 transition hover:border-brand-300 hover:text-brand-700 lg:inline-flex"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
            {t.nav.admin}
          </Link>
          <Link
            href="/artisans"
            className="hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-brand-500/25 transition hover:from-brand-700 hover:to-brand-600 sm:inline-flex sm:text-sm"
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            {t.nav.findArtisan}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={t.common.menu}
            className="inline-flex items-center justify-center rounded-xl border border-earth-200 p-2 text-earth-700 hover:bg-earth-100 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-earth-200 bg-white/95 px-4 pb-4 pt-2 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "rounded-xl px-3.5 py-2.5 text-sm font-semibold",
                  l.active ? "bg-brand-50 text-brand-700" : "text-earth-800 hover:bg-earth-100",
                )}
              >
                {l.label}
              </Link>
            ))}
            <div className="my-2 space-y-2 border-t border-earth-200 pt-3">
              <Link
                href="/artisans"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
              >
                <Compass className="h-4 w-4" />
                {t.nav.findArtisan}
              </Link>
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-earth-200 px-4 py-2 text-xs font-semibold text-earth-700"
              >
                <ShieldCheck className="h-4 w-4 text-brand-600" />
                {t.nav.admin}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
