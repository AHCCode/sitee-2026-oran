"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Eye, EyeOff, KeyRound, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function AdminLoginForm({ nextUrl }: { nextUrl: string }) {
  const { t } = useI18n();
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function fillDemoAdmin() {
    setIdentifier("admin@afrimetiers.com");
    setPassword("Admin@2026!");
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError(t.validation.required);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error?.message ?? t.api.invalidCredentials);
        setSubmitting(false);
        return;
      }
      const target = nextUrl.startsWith("/admin") && nextUrl !== "/admin/login" ? nextUrl : "/admin";
      router.replace(target);
      router.refresh();
    } catch {
      setError(t.common.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-earth-900 px-4 py-8 text-earth-900">
      <div className="mx-auto flex w-full max-w-md items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-earth-200 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.admin.login.backToSite}</span>
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="mx-auto my-8 w-full max-w-md">
        <div className="rounded-3xl border border-earth-700/60 bg-white p-6 shadow-2xl sm:p-8">
          <div className="mb-6 text-center">
            <img
              src="/images/logo.png"
              alt="AFRIMÉTIERS HUB"
              className="mx-auto mb-3 h-14 w-14 rounded-2xl object-cover shadow-md"
            />
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
              AFRIMÉTIERS HUB · {t.admin.brand}
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-earth-900">
              {t.admin.login.title}
            </h1>
            <p className="mt-1 text-xs text-earth-600 sm:text-sm">{t.admin.login.subtitle}</p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800 sm:text-sm"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="login-identifier" className="mb-1 block text-xs font-semibold text-earth-800">
                {t.admin.login.identifier}
              </label>
              <input
                id="login-identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@afrimetiers.com"
                className="h-11 w-full rounded-xl border border-earth-200 bg-earth-50/60 px-3.5 text-sm text-earth-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1 block text-xs font-semibold text-earth-800">
                {t.admin.login.password}
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-earth-200 bg-earth-50/60 pl-3.5 pr-10 text-sm text-earth-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t.admin.login.hidePassword : t.admin.login.showPassword}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-earth-500 hover:text-earth-800"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t.admin.login.submitting}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>{t.admin.login.submit}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials helper */}
          <div className="mt-6 rounded-2xl border border-earth-200 bg-earth-50/80 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs">
                <p className="font-semibold text-earth-800">{t.admin.login.demo}</p>
                <p className="font-mono text-[11px] text-earth-600">
                  admin@afrimetiers.com / Admin@2026!
                </p>
              </div>
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span> Auto</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-earth-400">AFRIMÉTIERS HUB</p>
    </div>
  );
}
