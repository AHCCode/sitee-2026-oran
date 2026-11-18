"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MapPin, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/text";

export function Footer() {
  const { t } = useI18n();
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-earth-200 bg-earth-900 text-earth-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <img
                src="/images/logo.png"
                alt="AFRIMÉTIERS HUB"
                className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-sm"
              />
              <span className="font-display text-lg font-bold tracking-tight text-white">
                AFRIMÉTIERS <span className="text-brand-400">HUB</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-earth-300">{t.footer.about}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-300">
              {t.footer.explore}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-earth-200">
              <li>
                <Link href="/artisans" className="hover:text-white">
                  {t.footer.allArtisans}
                </Link>
              </li>
              <li>
                <Link href="/artisans?featured=true" className="hover:text-white">
                  {t.footer.featured}
                </Link>
              </li>
              <li>
                <Link href="/#categories" className="hover:text-white">
                  {t.nav.categories}
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-white">
                  {t.nav.howItWorks}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-300">
              {t.footer.platform}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-earth-200">
              <li>
                <Link href="/artisans?category=menuiserie" className="hover:text-white">
                  Menuiserie / Carpentry
                </Link>
              </li>
              <li>
                <Link href="/artisans?category=couture" className="hover:text-white">
                  Couture / Tailoring
                </Link>
              </li>
              <li>
                <Link href="/artisans?category=electricite" className="hover:text-white">
                  Électricité & Solaire
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 font-medium text-brand-300 hover:text-brand-200"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {t.nav.admin}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-300">
              {t.footer.contact}
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm text-earth-300">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-brand-400" />
                <span>Dakar · Abidjan · Oran · Nairobi</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-brand-400" />
                <span>contact@afrimetiers.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-brand-400" />
                <span>+221 33 820 00 00</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-earth-800 pt-6 text-xs text-earth-400 sm:flex-row">
          <p>{fmt(t.footer.rights, { year })}</p>
          <p>{t.footer.madeWith}</p>
        </div>
      </div>
    </footer>
  );
}
