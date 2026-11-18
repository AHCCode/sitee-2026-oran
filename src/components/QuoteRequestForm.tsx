"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import clsx from "clsx";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/text";
import { quoteCreateSchema, zodToFieldErrors } from "@/lib/validation";

type FieldErrors = Record<string, string[]>;

export function QuoteRequestForm({
  artisanId,
  artisanName,
}: {
  artisanId: string;
  artisanName: string;
}) {
  const { locale, t } = useI18n();
  const router = useRouter();

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [consent, setConsent] = useState(false);
  const [faxNumber, setFaxNumber] = useState(""); // honeypot

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function clearField(field: string) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBannerError(null);

    const payload = {
      artisanId,
      clientName,
      clientEmail,
      clientPhone,
      subject,
      description,
      budget: budget || undefined,
      consent: consent as true,
      ...(faxNumber ? { fax_number: faxNumber } : {}),
    };

    // Client-side validation (uses the exact same Zod schema as POST /api/quotes)
    const parsed = quoteCreateSchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors(zodToFieldErrors(parsed.error, locale));
      setBannerError(t.quote.errorsSummary);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));

      if (res.status === 422 && json?.error?.fields) {
        setFieldErrors(json.error.fields as FieldErrors);
        setBannerError(json.error.message ?? t.quote.errorsSummary);
        setSubmitting(false);
        return;
      }

      if (!res.ok || !json?.data?.reference) {
        setBannerError(json?.error?.message ?? t.quote.genericError);
        setSubmitting(false);
        return;
      }

      const url: string =
        json.data.confirmationUrl ??
        `/quotes/${json.data.reference}?t=${encodeURIComponent(json.data.token ?? "")}`;
      router.push(url);
    } catch {
      setBannerError(t.quote.genericError);
      setSubmitting(false);
    }
  }

  const err = (name: string) => fieldErrors[name]?.[0];

  return (
    <div id="request-quote" className="rounded-2xl border border-earth-200 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-5">
        <h2 className="font-display text-xl font-bold text-earth-900">{t.quote.title}</h2>
        <p className="mt-1 text-sm text-earth-600">{fmt(t.quote.subtitle, { name: artisanName })}</p>
      </div>

      {bannerError && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800 sm:text-sm"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <span>{bannerError}</span>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {/* Honeypot anti-spam field */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="quote-fax">Fax</label>
          <input
            id="quote-fax"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={faxNumber}
            onChange={(e) => setFaxNumber(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="quote-name" className="mb-1 block text-xs font-semibold text-earth-800">
            {t.quote.clientName} <span className="text-brand-600">*</span>
          </label>
          <input
            id="quote-name"
            name="clientName"
            type="text"
            required
            value={clientName}
            onChange={(e) => {
              setClientName(e.target.value);
              clearField("clientName");
            }}
            aria-invalid={Boolean(err("clientName"))}
            className={clsx(
              "h-11 w-full rounded-xl border px-3.5 text-sm text-earth-900 focus:outline-none focus:ring-2",
              err("clientName")
                ? "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500/20"
                : "border-earth-200 bg-earth-50/50 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20",
            )}
          />
          {err("clientName") && (
            <p className="mt-1 text-xs font-medium text-red-600" role="alert">
              {err("clientName")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="quote-email" className="mb-1 block text-xs font-semibold text-earth-800">
              {t.quote.clientEmail} <span className="text-brand-600">*</span>
            </label>
            <input
              id="quote-email"
              name="clientEmail"
              type="email"
              required
              value={clientEmail}
              onChange={(e) => {
                setClientEmail(e.target.value);
                clearField("clientEmail");
              }}
              aria-invalid={Boolean(err("clientEmail"))}
              className={clsx(
                "h-11 w-full rounded-xl border px-3.5 text-sm text-earth-900 focus:outline-none focus:ring-2",
                err("clientEmail")
                  ? "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500/20"
                  : "border-earth-200 bg-earth-50/50 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20",
              )}
            />
            {err("clientEmail") && (
              <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                {err("clientEmail")}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="quote-phone" className="mb-1 block text-xs font-semibold text-earth-800">
              {t.quote.clientPhone} <span className="text-brand-600">*</span>
            </label>
            <input
              id="quote-phone"
              name="clientPhone"
              type="tel"
              required
              placeholder="+221 77 000 00 00"
              value={clientPhone}
              onChange={(e) => {
                setClientPhone(e.target.value);
                clearField("clientPhone");
              }}
              aria-invalid={Boolean(err("clientPhone"))}
              className={clsx(
                "h-11 w-full rounded-xl border px-3.5 text-sm text-earth-900 focus:outline-none focus:ring-2",
                err("clientPhone")
                  ? "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500/20"
                  : "border-earth-200 bg-earth-50/50 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20",
              )}
            />
            {err("clientPhone") && (
              <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                {err("clientPhone")}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="quote-subject" className="mb-1 block text-xs font-semibold text-earth-800">
            {t.quote.subject} <span className="text-brand-600">*</span>
          </label>
          <input
            id="quote-subject"
            name="subject"
            type="text"
            required
            placeholder={t.quote.subjectPlaceholder}
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              clearField("subject");
            }}
            aria-invalid={Boolean(err("subject"))}
            className={clsx(
              "h-11 w-full rounded-xl border px-3.5 text-sm text-earth-900 focus:outline-none focus:ring-2",
              err("subject")
                ? "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500/20"
                : "border-earth-200 bg-earth-50/50 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20",
            )}
          />
          {err("subject") && (
            <p className="mt-1 text-xs font-medium text-red-600" role="alert">
              {err("subject")}
            </p>
          )}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="quote-description" className="block text-xs font-semibold text-earth-800">
              {t.quote.description} <span className="text-brand-600">*</span>
            </label>
            <span className="text-[11px] text-earth-500">
              {fmt(t.quote.chars, { count: description.length, max: 3000 })}
            </span>
          </div>
          <textarea
            id="quote-description"
            name="description"
            rows={4}
            required
            placeholder={t.quote.descriptionPlaceholder}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              clearField("description");
            }}
            aria-invalid={Boolean(err("description"))}
            className={clsx(
              "w-full rounded-xl border p-3.5 text-sm text-earth-900 focus:outline-none focus:ring-2",
              err("description")
                ? "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500/20"
                : "border-earth-200 bg-earth-50/50 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20",
            )}
          />
          {err("description") && (
            <p className="mt-1 text-xs font-medium text-red-600" role="alert">
              {err("description")}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="quote-budget" className="mb-1 block text-xs font-semibold text-earth-800">
            {t.quote.budget}{" "}
            <span className="font-normal text-earth-500">({t.common.optional})</span>
          </label>
          <input
            id="quote-budget"
            name="budget"
            type="text"
            placeholder={t.quote.budgetPlaceholder}
            value={budget}
            onChange={(e) => {
              setBudget(e.target.value);
              clearField("budget");
            }}
            className="h-11 w-full rounded-xl border border-earth-200 bg-earth-50/50 px-3.5 text-sm text-earth-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          {err("budget") && (
            <p className="mt-1 text-xs font-medium text-red-600" role="alert">
              {err("budget")}
            </p>
          )}
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-xs text-earth-700">
            <input
              type="checkbox"
              name="consent"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                clearField("consent");
              }}
              className="mt-0.5 h-4 w-4 rounded border-earth-300 text-brand-600 focus:ring-brand-500"
            />
            <span>{t.quote.consent}</span>
          </label>
          {err("consent") && (
            <p className="mt-1 text-xs font-medium text-red-600" role="alert">
              {err("consent")}
            </p>
          )}
        </div>

        {err("artisanId") && (
          <p className="text-xs font-medium text-red-600" role="alert">
            {err("artisanId")}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t.quote.submitting}</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>{t.quote.submit}</span>
            </>
          )}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-earth-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-forest-600" />
          <span>{t.artisan.responseTime}</span>
        </p>
      </form>
    </div>
  );
}
