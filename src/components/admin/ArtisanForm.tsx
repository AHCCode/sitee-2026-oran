"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import clsx from "clsx";
import { ARTISAN_STATUSES, MAX_PHOTOS, MAX_SERVICES, type ArtisanStatus } from "@/lib/constants";
import type { CategoryDTO, CityDTO, CountryDTO } from "@/lib/services/catalog";
import type { AdminArtisanDTO } from "@/lib/services/artisans";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/text";
import { artisanSchema, zodToFieldErrors } from "@/lib/validation";

type FieldErrors = Record<string, string[]>;

export function ArtisanForm({
  mode,
  initial,
  categories,
  countries,
  initialCities = [],
}: {
  mode: "create" | "edit";
  initial?: AdminArtisanDTO;
  categories: CategoryDTO[];
  countries: CountryDTO[];
  initialCities?: CityDTO[];
}) {
  const { locale, t } = useI18n();
  const router = useRouter();

  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [businessName, setBusinessName] = useState(initial?.businessName ?? "");
  const [categoryId, setCategoryId] = useState<string>(initial ? String(initial.categoryId) : "");
  const [yearsExperience, setYearsExperience] = useState<string>(
    initial ? String(initial.yearsExperience) : "5",
  );
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [countryId, setCountryId] = useState<string>(initial ? String(initial.countryId) : "");
  const [cityId, setCityId] = useState<string>(initial ? String(initial.cityId) : "");
  const [cities, setCities] = useState<CityDTO[]>(initialCities);
  const [loadingCities, setLoadingCities] = useState(false);

  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");

  const [services, setServices] = useState<string[]>(initial?.services ?? []);
  const [serviceDraft, setServiceDraft] = useState("");

  const [photos, setPhotos] = useState<{ url: string; caption: string | null }[]>(
    initial?.photos ?? [],
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [status, setStatus] = useState<ArtisanStatus>(initial?.status ?? "DRAFT");
  const [featured, setFeatured] = useState<boolean>(initial?.featured ?? false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!countryId) {
      setCities([]);
      setCityId("");
      return;
    }
    let cancelled = false;
    setLoadingCities(true);
    fetch(`/api/countries/${countryId}/cities`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const list: CityDTO[] = Array.isArray(json.data) ? json.data : [];
        setCities(list);
        if (cityId && !list.some((c) => String(c.id) === cityId)) {
          setCityId("");
        }
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCities(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countryId]);

  function clearField(field: string) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function addService() {
    const val = serviceDraft.trim();
    if (val.length < 2 || services.length >= MAX_SERVICES) return;
    if (!services.includes(val)) {
      setServices((prev) => [...prev, val]);
      clearField("services");
    }
    setServiceDraft("");
  }

  function removeService(target: string) {
    setServices((prev) => prev.filter((s) => s !== target));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (photos.length >= MAX_PHOTOS) break;
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/uploads", { method: "POST", body: fd });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.data?.url) {
          setUploadError(json?.error?.message ?? t.api.uploadType);
          break;
        }
        setPhotos((prev) => [...prev, { url: json.data.url as string, caption: null }]);
      }
    } catch {
      setUploadError(t.common.error);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function makeCover(index: number) {
    setPhotos((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const copy = [...prev];
      const [picked] = copy.splice(index, 1);
      return [picked!, ...copy];
    });
  }

  async function save(overrideStatus?: ArtisanStatus) {
    setBannerError(null);
    const effectiveStatus = overrideStatus ?? status;

    // If the user typed a service in the input box and forgot to click "Add", include it automatically
    const effectiveServices =
      services.length === 0 && serviceDraft.trim().length >= 2
        ? [serviceDraft.trim()]
        : services;

    const payload = {
      fullName,
      businessName: businessName || null,
      categoryId: categoryId ? Number(categoryId) : 0,
      countryId: countryId ? Number(countryId) : 0,
      cityId: cityId ? Number(cityId) : 0,
      phone,
      email,
      website: website || null,
      bio,
      yearsExperience: Number(yearsExperience || 0),
      services: effectiveServices,
      photos,
      featured,
      status: effectiveStatus,
    };

    const parsed = artisanSchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors(zodToFieldErrors(parsed.error, locale));
      setBannerError(t.admin.form.fixErrors);
      return;
    }

    setFieldErrors({});
    setSaving(true);
    try {
      const endpoint = mode === "create" ? "/api/admin/artisans" : `/api/admin/artisans/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 422 && json?.error?.fields) {
        setFieldErrors(json.error.fields as FieldErrors);
        setBannerError(json.error.message ?? t.admin.form.fixErrors);
        setSaving(false);
        return;
      }
      if (!res.ok) {
        setBannerError(json?.error?.message ?? t.common.error);
        setSaving(false);
        return;
      }
      router.push("/admin/artisans");
      router.refresh();
    } catch {
      setBannerError(t.common.error);
      setSaving(false);
    }
  }

  const err = (name: string) => fieldErrors[name]?.[0];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/artisans"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-earth-600 hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t.common.back}</span>
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold text-earth-900 sm:text-3xl">
            {mode === "create" ? t.admin.form.createTitle : t.admin.form.editTitle}
          </h1>
        </div>
      </div>

      {bannerError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 sm:text-sm"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <span>{bannerError}</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        noValidate
        className="space-y-6"
      >
        {/* 1. Identity & Trade */}
        <section className="rounded-2xl border border-earth-200 bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-earth-900">
            {t.admin.form.sectionIdentity} & {t.admin.form.sectionPro}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="art-fullName" className="mb-1 block text-xs font-semibold text-earth-800">
                {t.admin.form.fullName} <span className="text-brand-600">*</span>
              </label>
              <input
                id="art-fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearField("fullName");
                }}
                className={clsx(
                  "h-11 w-full rounded-xl border px-3.5 text-sm text-earth-900 focus:outline-none focus:ring-2",
                  err("fullName")
                    ? "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500/20"
                    : "border-earth-200 bg-earth-50/50 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20",
                )}
              />
              {err("fullName") && (
                <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                  {err("fullName")}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="art-businessName" className="mb-1 block text-xs font-semibold text-earth-800">
                {t.admin.form.businessName}{" "}
                <span className="font-normal text-earth-500">({t.common.optional})</span>
              </label>
              <input
                id="art-businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="h-11 w-full rounded-xl border border-earth-200 bg-earth-50/50 px-3.5 text-sm text-earth-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label htmlFor="art-category" className="mb-1 block text-xs font-semibold text-earth-800">
                {t.admin.form.category} <span className="text-brand-600">*</span>
              </label>
              <select
                id="art-category"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  clearField("categoryId");
                }}
                className={clsx(
                  "h-11 w-full rounded-xl border px-3 text-sm text-earth-900 focus:outline-none focus:ring-2",
                  err("categoryId")
                    ? "border-red-400 bg-red-50/40"
                    : "border-earth-200 bg-earth-50/50 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20",
                )}
              >
                <option value="">{t.search.allCategories}</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              {err("categoryId") && (
                <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                  {err("categoryId")}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="art-years" className="mb-1 block text-xs font-semibold text-earth-800">
                {t.admin.form.yearsExperience} <span className="text-brand-600">*</span>
              </label>
              <input
                id="art-years"
                type="number"
                min={0}
                max={70}
                value={yearsExperience}
                onChange={(e) => {
                  setYearsExperience(e.target.value);
                  clearField("yearsExperience");
                }}
                className="h-11 w-full rounded-xl border border-earth-200 bg-earth-50/50 px-3.5 text-sm text-earth-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              {err("yearsExperience") && (
                <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                  {err("yearsExperience")}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="art-bio" className="block text-xs font-semibold text-earth-800">
                  {t.admin.form.bio} <span className="text-brand-600">*</span>
                </label>
                <span className="text-[11px] text-earth-500">{bio.length}/2000</span>
              </div>
              <textarea
                id="art-bio"
                rows={4}
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  clearField("bio");
                }}
                placeholder={t.admin.form.bioHint}
                className={clsx(
                  "w-full rounded-xl border p-3.5 text-sm text-earth-900 focus:outline-none focus:ring-2",
                  err("bio")
                    ? "border-red-400 bg-red-50/40"
                    : "border-earth-200 bg-earth-50/50 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20",
                )}
              />
              {err("bio") && (
                <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                  {err("bio")}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 2. Location & Contact */}
        <section className="rounded-2xl border border-earth-200 bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-earth-900">
            {t.admin.form.sectionLocation} & {t.admin.form.sectionContact}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="art-country" className="mb-1 block text-xs font-semibold text-earth-800">
                {t.admin.form.country} <span className="text-brand-600">*</span>
              </label>
              <select
                id="art-country"
                value={countryId}
                onChange={(e) => {
                  setCountryId(e.target.value);
                  setCityId("");
                  clearField("countryId");
                }}
                className={clsx(
                  "h-11 w-full rounded-xl border px-3 text-sm text-earth-900 focus:outline-none focus:ring-2",
                  err("countryId")
                    ? "border-red-400 bg-red-50/40"
                    : "border-earth-200 bg-earth-50/50 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20",
                )}
              >
                <option value="">{t.search.allCountries}</option>
                {countries.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              {err("countryId") && (
                <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                  {err("countryId")}
                </p>
              )}
            </div>

            <div className="relative">
              <label htmlFor="art-city" className="mb-1 block text-xs font-semibold text-earth-800">
                {t.admin.form.city} <span className="text-brand-600">*</span>
              </label>
              <select
                id="art-city"
                value={cityId}
                onChange={(e) => {
                  setCityId(e.target.value);
                  clearField("cityId");
                }}
                disabled={!countryId || loadingCities}
                className={clsx(
                  "h-11 w-full rounded-xl border px-3 text-sm text-earth-900 focus:outline-none focus:ring-2 disabled:opacity-60",
                  err("cityId")
                    ? "border-red-400 bg-red-50/40"
                    : "border-earth-200 bg-earth-50/50 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20",
                )}
              >
                <option value="">
                  {!countryId
                    ? t.search.selectCountryFirst
                    : loadingCities
                      ? t.search.loadingCities
                      : t.search.allCities}
                </option>
                {cities.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              {err("cityId") && (
                <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                  {err("cityId")}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="art-phone" className="mb-1 block text-xs font-semibold text-earth-800">
                {t.admin.form.phone} <span className="text-brand-600">*</span>
              </label>
              <input
                id="art-phone"
                type="tel"
                placeholder="+221 77 000 00 00"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearField("phone");
                }}
                className={clsx(
                  "h-11 w-full rounded-xl border px-3.5 text-sm text-earth-900 focus:outline-none focus:ring-2",
                  err("phone")
                    ? "border-red-400 bg-red-50/40"
                    : "border-earth-200 bg-earth-50/50 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20",
                )}
              />
              {err("phone") && (
                <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                  {err("phone")}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="art-email" className="mb-1 block text-xs font-semibold text-earth-800">
                {t.admin.form.email} <span className="text-brand-600">*</span>
              </label>
              <input
                id="art-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearField("email");
                }}
                className={clsx(
                  "h-11 w-full rounded-xl border px-3.5 text-sm text-earth-900 focus:outline-none focus:ring-2",
                  err("email")
                    ? "border-red-400 bg-red-50/40"
                    : "border-earth-200 bg-earth-50/50 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20",
                )}
              />
              {err("email") && (
                <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                  {err("email")}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="art-website" className="mb-1 block text-xs font-semibold text-earth-800">
                {t.admin.form.website}{" "}
                <span className="font-normal text-earth-500">({t.common.optional})</span>
              </label>
              <input
                id="art-website"
                type="url"
                placeholder="https://"
                value={website}
                onChange={(e) => {
                  setWebsite(e.target.value);
                  clearField("website");
                }}
                className={clsx(
                  "h-11 w-full rounded-xl border px-3.5 text-sm text-earth-900 focus:outline-none focus:ring-2",
                  err("website")
                    ? "border-red-400 bg-red-50/40"
                    : "border-earth-200 bg-earth-50/50 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20",
                )}
              />
              {err("website") && (
                <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                  {err("website")}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 3. Services offered */}
        <section className="rounded-2xl border border-earth-200 bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-3 font-display text-lg font-bold text-earth-900">
            {t.admin.form.sectionServices} <span className="text-brand-600">*</span>
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={serviceDraft}
              onChange={(e) => setServiceDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addService();
                }
              }}
              placeholder={t.admin.form.servicePlaceholder}
              className="h-11 flex-1 rounded-xl border border-earth-200 bg-earth-50/50 px-3.5 text-sm text-earth-900 focus:border-brand-500 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={addService}
              className="inline-flex items-center gap-1.5 rounded-xl bg-earth-800 px-4 text-xs font-semibold text-white hover:bg-earth-900"
            >
              <Plus className="h-4 w-4" />
              <span>{t.admin.form.addService}</span>
            </button>
          </div>

          {err("services") && (
            <p className="mt-2 text-xs font-medium text-red-600" role="alert">
              {err("services")}
            </p>
          )}

          {services.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {services.map((s) => (
                <li
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-900"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => removeService(s)}
                    aria-label={fmt(t.admin.form.removeService, { name: s })}
                    className="rounded-full p-0.5 text-brand-700 hover:bg-brand-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 4. Photos upload */}
        <section className="rounded-2xl border border-earth-200 bg-white p-5 shadow-card sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-earth-900">
                {t.admin.form.sectionPhotos}
              </h2>
              <p className="text-xs text-earth-500">
                {fmt(t.admin.form.photoHint, { max: MAX_PHOTOS })}
              </p>
            </div>

            {photos.length < MAX_PHOTOS && (
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t.admin.form.uploading}</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-4 w-4" />
                    <span>{t.admin.form.uploadPhoto}</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  disabled={uploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {uploadError && (
            <p className="mb-3 text-xs font-medium text-red-600" role="alert">
              {uploadError}
            </p>
          )}

          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {photos.map((p, idx) => (
                <div
                  key={`${p.url}-${idx}`}
                  className="group relative overflow-hidden rounded-xl border border-earth-200 bg-earth-100"
                >
                  <img src={p.url} alt="" className="aspect-[4/3] w-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                      {t.admin.form.cover}
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-1 bg-white p-2 text-xs">
                    {idx > 0 ? (
                      <button
                        type="button"
                        onClick={() => makeCover(idx)}
                        className="font-semibold text-brand-700 hover:underline"
                      >
                        {t.admin.form.makeCover}
                      </button>
                    ) : (
                      <span className="text-earth-400">#1</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="inline-flex items-center gap-0.5 font-semibold text-red-600 hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{t.admin.form.removePhoto}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. Publication & Featured */}
        <section className="rounded-2xl border border-earth-200 bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-earth-900">
            {t.admin.form.sectionPublication}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="art-status" className="mb-1 block text-xs font-semibold text-earth-800">
                {t.admin.form.status}
              </label>
              <select
                id="art-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ArtisanStatus)}
                className="h-11 w-full rounded-xl border border-earth-200 bg-earth-50/50 px-3 text-sm text-earth-900 focus:border-brand-500 focus:bg-white focus:outline-none"
              >
                {ARTISAN_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {t.artisanStatus[st]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center pt-4">
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-earth-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs">
                  <strong className="inline-flex items-center gap-1 font-semibold text-earth-900">
                    <Star className="h-3.5 w-3.5 text-brand-600" />
                    {t.admin.form.featured}
                  </strong>
                  <span className="block text-earth-500">{t.admin.form.featuredHint}</span>
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            href="/admin/artisans"
            className="rounded-xl border border-earth-200 bg-white px-4 py-2.5 text-sm font-semibold text-earth-800 hover:bg-earth-50"
          >
            {t.admin.form.cancel}
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-earth-800 bg-earth-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-earth-800 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{saving ? t.admin.form.saving : t.admin.form.saveDraft}</span>
          </button>

          {status !== "PUBLISHED" && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void save("PUBLISHED")}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{t.admin.form.saveAndPublish}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
