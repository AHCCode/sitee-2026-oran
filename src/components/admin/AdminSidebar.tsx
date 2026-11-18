"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  FileSpreadsheet,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import clsx from "clsx";
import type { SessionUser } from "@/lib/auth";
import { useI18n } from "@/lib/i18n/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function AdminSidebar({
  user,
  pendingQuotesCount,
}: {
  user: SessionUser;
  pendingQuotesCount: number;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = [
    {
      href: "/admin",
      label: t.admin.nav.dashboard,
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      href: "/admin/artisans",
      label: t.admin.nav.artisans,
      icon: Users,
      active: pathname.startsWith("/admin/artisans"),
    },
    {
      href: "/admin/quotes",
      label: t.admin.nav.quotes,
      icon: FileSpreadsheet,
      active: pathname.startsWith("/admin/quotes"),
      badge: pendingQuotesCount > 0 ? pendingQuotesCount : undefined,
    },
  ];

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-earth-900 p-4 text-earth-100">
      <div>
        <div className="flex items-center justify-between border-b border-earth-800 pb-4">
          <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
            <img
              src="/images/logo.png"
              alt="AFRIMÉTIERS HUB"
              className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-sm"
            />
            <div>
              <span className="block font-display text-sm font-bold tracking-tight text-white">
                AFRIMÉTIERS <span className="text-brand-400">HUB</span>
              </span>
              <span className="block text-[11px] font-medium text-earth-400">{t.admin.brand}</span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-earth-300 hover:bg-earth-800 lg:hidden"
            aria-label={t.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-5 space-y-1.5" aria-label="Admin">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  item.active
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-earth-200 hover:bg-earth-800 hover:text-white",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.badge !== undefined && (
                  <span
                    className={clsx(
                      "rounded-full px-2 py-0.5 text-xs font-bold",
                      item.active ? "bg-white text-brand-700" : "bg-brand-500 text-white",
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 border-t border-earth-800 pt-4">
        <div className="flex items-center justify-between">
          <LanguageSwitcher compact />
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-earth-300 hover:text-white"
          >
            <span>{t.admin.nav.viewSite}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-xl bg-earth-800/80 p-3">
          <p className="truncate text-xs font-semibold text-white">{user.name}</p>
          <p className="truncate text-[11px] text-earth-400">{user.email}</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-earth-700 bg-earth-800/60 px-3.5 py-2.5 text-xs font-semibold text-earth-200 transition hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-200 disabled:opacity-60"
        >
          {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          <span>{loggingOut ? t.admin.nav.loggingOut : t.admin.nav.logout}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-earth-200 bg-earth-900 px-4 text-white lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <img
            src="/images/logo.png"
            alt="AFRIMÉTIERS HUB"
            className="h-8 w-8 shrink-0 rounded-lg object-cover"
          />
          <span className="font-display text-sm font-bold">
            AFRIMÉTIERS <span className="text-brand-400">ADMIN</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label={t.common.menu}
            className="rounded-lg border border-earth-700 p-1.5 text-earth-100 hover:bg-earth-800"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-72 max-w-[85vw]">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
