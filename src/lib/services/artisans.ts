import "server-only";
import { unlink } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma";
import {
  ADMIN_PAGE_SIZE,
  ARTISAN_SORTS,
  ARTISAN_STATUSES,
  MAX_PAGE_SIZE,
  PUBLIC_PAGE_SIZE,
  type ArtisanSort,
  type ArtisanStatus,
  type Locale,
} from "../constants";
import { getDictionary, localName } from "../i18n";
import { normalizeText, searchTokens } from "../text";
import type { ArtisanData } from "../validation";
import { UPLOAD_DIR } from "../uploads";

/* ----------------------------------- DTOs ---------------------------------- */

const cardInclude = {
  category: true,
  country: true,
  city: true,
  services: { orderBy: { position: "asc" }, take: 3 },
  photos: { orderBy: { position: "asc" }, take: 1 },
} satisfies Prisma.ArtisanInclude;

type CardRow = Prisma.ArtisanGetPayload<{ include: typeof cardInclude }>;

export type ArtisanCardDTO = {
  id: string;
  fullName: string;
  businessName: string | null;
  yearsExperience: number;
  featured: boolean;
  coverUrl: string | null;
  bioExcerpt: string;
  services: string[];
  category: { id: number; slug: string; name: string; icon: string };
  country: { id: number; code: string; name: string };
  city: { id: number; name: string };
};

function excerpt(text: string, max = 140) {
  return text.length <= max ? text : `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

export function toCard(a: CardRow, locale: Locale): ArtisanCardDTO {
  return {
    id: a.id,
    fullName: a.fullName,
    businessName: a.businessName,
    yearsExperience: a.yearsExperience,
    featured: a.featured,
    coverUrl: a.photos[0]?.url ?? null,
    bioExcerpt: excerpt(a.bio),
    services: a.services.map((s) => s.name),
    category: { id: a.category.id, slug: a.category.slug, name: localName(a.category, locale), icon: a.category.icon },
    country: { id: a.country.id, code: a.country.code, name: localName(a.country, locale) },
    city: { id: a.city.id, name: a.city.name },
  };
}

/* ------------------------------ Public search ------------------------------ */

const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

export const artisanQuerySchema = z.object({
  q: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  category: z.preprocess(emptyToUndefined, z.string().trim().regex(/^[a-z0-9-]{1,60}$/).optional()),
  country: z.preprocess(emptyToUndefined, z.string().trim().regex(/^([A-Za-z]{2}|\d{1,6})$/).optional()),
  city: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  sort: z.preprocess(emptyToUndefined, z.enum(ARTISAN_SORTS).optional()),
  featured: z.preprocess(emptyToUndefined, z.enum(["true", "false", "1", "0"]).optional()),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(10_000).optional()),
  pageSize: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional()),
});
export type ArtisanQuery = z.infer<typeof artisanQuerySchema>;

export function searchParamsToObject(sp: URLSearchParams | Record<string, string | string[] | undefined>) {
  const obj: Record<string, string> = {};
  if (sp instanceof URLSearchParams) {
    sp.forEach((v, k) => (obj[k] = v));
  } else {
    for (const [k, v] of Object.entries(sp)) if (v !== undefined) obj[k] = Array.isArray(v) ? v[0] ?? "" : v;
  }
  return obj;
}

/** Lenient parse for pages: invalid params are simply dropped. */
export function parseArtisanQueryLenient(raw: Record<string, string>): ArtisanQuery {
  const out: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(artisanQuerySchema.shape)) {
    const r = (schema as z.ZodTypeAny).safeParse(raw[key]);
    if (r.success && r.data !== undefined) out[key] = r.data;
  }
  return out as ArtisanQuery;
}

function sortOrder(sort: ArtisanSort | undefined): Prisma.ArtisanOrderByWithRelationInput[] {
  switch (sort) {
    case "recent":
      return [{ publishedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }];
    case "name":
      return [{ fullName: "asc" }, { id: "asc" }];
    case "experience":
      return [{ yearsExperience: "desc" }, { fullName: "asc" }, { id: "asc" }];
    default:
      return [{ featured: "desc" }, { yearsExperience: "desc" }, { publishedAt: "desc" }, { id: "asc" }];
  }
}

function publicWhere(q: ArtisanQuery): Prisma.ArtisanWhereInput {
  const where: Prisma.ArtisanWhereInput = { status: "PUBLISHED" };
  if (q.category) {
    if (/^\d+$/.test(q.category)) where.categoryId = Number(q.category);
    else where.category = { slug: q.category };
  }
  if (q.country) {
    if (/^\d+$/.test(q.country)) where.countryId = Number(q.country);
    else where.country = { code: q.country.toUpperCase() };
  }
  if (q.city) where.cityId = q.city;
  if (q.featured === "true" || q.featured === "1") where.featured = true;
  const tokens = searchTokens(q.q);
  if (tokens.length) where.AND = tokens.map((t) => ({ searchText: { contains: t } }));
  return where;
}

export async function searchPublicArtisans(q: ArtisanQuery, locale: Locale) {
  const pageSize = q.pageSize ?? PUBLIC_PAGE_SIZE;
  const where = publicWhere(q);
  const total = await prisma.artisan.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(q.page ?? 1, totalPages);
  const rows = await prisma.artisan.findMany({
    where,
    include: cardInclude,
    orderBy: sortOrder(q.sort),
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  return { items: rows.map((r) => toCard(r, locale)), total, page, pageSize, totalPages };
}

export async function getFeaturedArtisans(locale: Locale, take = 8) {
  const rows = await prisma.artisan.findMany({
    where: { status: "PUBLISHED", featured: true },
    include: cardInclude,
    orderBy: [{ yearsExperience: "desc" }, { id: "asc" }],
    take,
  });
  return rows.map((r) => toCard(r, locale));
}

/* ------------------------------ Public detail ------------------------------ */

export async function getPublicArtisan(id: string, locale: Locale) {
  if (!id || id.length > 64) return null;
  const a = await prisma.artisan.findFirst({
    where: { id, status: "PUBLISHED" },
    include: {
      category: true,
      country: true,
      city: true,
      services: { orderBy: { position: "asc" } },
      photos: { orderBy: { position: "asc" } },
    },
  });
  if (!a) return null;

  // Similar artisans: same trade, same country first, then elsewhere.
  const base = { status: "PUBLISHED", categoryId: a.categoryId, id: { not: a.id } } satisfies Prisma.ArtisanWhereInput;
  const sameCountry = await prisma.artisan.findMany({
    where: { ...base, countryId: a.countryId },
    include: cardInclude,
    orderBy: sortOrder("relevance"),
    take: 4,
  });
  const others =
    sameCountry.length < 4
      ? await prisma.artisan.findMany({
          where: { ...base, countryId: { not: a.countryId } },
          include: cardInclude,
          orderBy: sortOrder("relevance"),
          take: 4 - sameCountry.length,
        })
      : [];

  return {
    id: a.id,
    fullName: a.fullName,
    businessName: a.businessName,
    bio: a.bio,
    yearsExperience: a.yearsExperience,
    featured: a.featured,
    phone: a.phone,
    email: a.email,
    website: a.website,
    publishedAt: a.publishedAt,
    createdAt: a.createdAt,
    category: { id: a.category.id, slug: a.category.slug, name: localName(a.category, locale), icon: a.category.icon },
    country: { id: a.country.id, code: a.country.code, name: localName(a.country, locale) },
    city: { id: a.city.id, name: a.city.name },
    services: a.services.map((s) => s.name),
    photos: a.photos.map((p) => ({ id: p.id, url: p.url, caption: p.caption })),
    similar: [...sameCountry, ...others].map((r) => toCard(r, locale)),
  };
}
export type PublicArtisanDTO = NonNullable<Awaited<ReturnType<typeof getPublicArtisan>>>;

/* ---------------------------------- Admin ---------------------------------- */

export const adminArtisanQuerySchema = z.object({
  q: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  category: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  country: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  status: z.preprocess(emptyToUndefined, z.enum(ARTISAN_STATUSES).optional()),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(10_000).optional()),
  pageSize: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional()),
});

export async function listAdminArtisans(q: z.infer<typeof adminArtisanQuerySchema>, locale: Locale) {
  const pageSize = q.pageSize ?? ADMIN_PAGE_SIZE;
  const where: Prisma.ArtisanWhereInput = {};
  if (q.category) where.categoryId = q.category;
  if (q.country) where.countryId = q.country;
  if (q.status) where.status = q.status;
  const tokens = searchTokens(q.q);
  if (tokens.length) where.AND = tokens.map((t) => ({ searchText: { contains: t } }));

  const [total, statusGroups] = await Promise.all([
    prisma.artisan.count({ where }),
    prisma.artisan.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(q.page ?? 1, totalPages);
  const rows = await prisma.artisan.findMany({
    where,
    include: {
      category: true,
      country: true,
      city: true,
      photos: { orderBy: { position: "asc" }, take: 1 },
      _count: { select: { quotes: true } },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const statusCounts = Object.fromEntries(ARTISAN_STATUSES.map((s) => [s, 0])) as Record<ArtisanStatus, number>;
  for (const g of statusGroups) statusCounts[g.status as ArtisanStatus] = g._count._all;

  return {
    items: rows.map((a) => ({
      id: a.id,
      fullName: a.fullName,
      businessName: a.businessName,
      email: a.email,
      phone: a.phone,
      status: a.status as ArtisanStatus,
      featured: a.featured,
      coverUrl: a.photos[0]?.url ?? null,
      category: { id: a.category.id, name: localName(a.category, locale), icon: a.category.icon },
      country: { id: a.country.id, code: a.country.code, name: localName(a.country, locale) },
      city: { id: a.city.id, name: a.city.name },
      quoteCount: a._count.quotes,
      updatedAt: a.updatedAt,
    })),
    total,
    page,
    pageSize,
    totalPages,
    statusCounts,
  };
}

export async function getAdminArtisan(id: string, locale: Locale) {
  const a = await prisma.artisan.findUnique({
    where: { id },
    include: {
      category: true,
      country: true,
      city: true,
      services: { orderBy: { position: "asc" } },
      photos: { orderBy: { position: "asc" } },
      _count: { select: { quotes: true } },
    },
  });
  if (!a) return null;
  return {
    id: a.id,
    fullName: a.fullName,
    businessName: a.businessName,
    categoryId: a.categoryId,
    countryId: a.countryId,
    cityId: a.cityId,
    phone: a.phone,
    email: a.email,
    website: a.website,
    bio: a.bio,
    yearsExperience: a.yearsExperience,
    featured: a.featured,
    status: a.status as ArtisanStatus,
    publishedAt: a.publishedAt,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    services: a.services.map((s) => s.name),
    photos: a.photos.map((p) => ({ url: p.url, caption: p.caption })),
    category: { id: a.category.id, name: localName(a.category, locale), icon: a.category.icon },
    country: { id: a.country.id, code: a.country.code, name: localName(a.country, locale) },
    city: { id: a.city.id, name: a.city.name },
    quoteCount: a._count.quotes,
  };
}
export type AdminArtisanDTO = NonNullable<Awaited<ReturnType<typeof getAdminArtisan>>>;

/** Check that category / country / city exist and are consistent. Returns field errors or null. */
export async function checkArtisanReferences(data: ArtisanData, locale: Locale) {
  const v = getDictionary(locale).validation;
  const [category, country, city] = await Promise.all([
    prisma.category.findUnique({ where: { id: data.categoryId } }),
    prisma.country.findUnique({ where: { id: data.countryId } }),
    prisma.city.findUnique({ where: { id: data.cityId } }),
  ]);
  const errors: Record<string, string[]> = {};
  if (!category) errors.categoryId = [v.select];
  if (!country) errors.countryId = [v.select];
  if (!city) errors.cityId = [v.select];
  else if (country && city.countryId !== country.id) errors.cityId = [v.cityMismatch];
  if (Object.keys(errors).length || !category || !country || !city) return { errors, refs: null };
  return { errors: null, refs: { category, country, city } };
}

export function buildSearchText(
  data: Pick<ArtisanData, "fullName" | "businessName" | "bio" | "services" | "email">,
  refs: { category: { nameFr: string; nameEn: string }; country: { nameFr: string; nameEn: string }; city: { name: string } },
) {
  return normalizeText(
    [
      data.fullName,
      data.businessName ?? "",
      data.email,
      refs.category.nameFr,
      refs.category.nameEn,
      refs.city.name,
      refs.country.nameFr,
      refs.country.nameEn,
      data.services.join(" "),
      data.bio,
    ].join(" "),
  );
}

function nestedWrites(data: ArtisanData) {
  return {
    services: { create: data.services.map((name, position) => ({ name, position })) },
    photos: { create: data.photos.map((p, position) => ({ url: p.url, caption: p.caption ?? null, position })) },
  };
}

export async function createArtisan(data: ArtisanData, searchText: string) {
  return prisma.artisan.create({
    data: {
      fullName: data.fullName,
      businessName: data.businessName,
      categoryId: data.categoryId,
      countryId: data.countryId,
      cityId: data.cityId,
      phone: data.phone,
      email: data.email,
      website: data.website,
      bio: data.bio,
      yearsExperience: data.yearsExperience,
      featured: data.featured,
      status: data.status,
      searchText,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      ...nestedWrites(data),
    },
    select: { id: true },
  });
}

export async function updateArtisan(id: string, data: ArtisanData, searchText: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.artisan.findUnique({ where: { id }, select: { publishedAt: true } });
    if (!existing) return null;
    await tx.artisanService.deleteMany({ where: { artisanId: id } });
    await tx.artisanPhoto.deleteMany({ where: { artisanId: id } });
    return tx.artisan.update({
      where: { id },
      data: {
        fullName: data.fullName,
        businessName: data.businessName,
        categoryId: data.categoryId,
        countryId: data.countryId,
        cityId: data.cityId,
        phone: data.phone,
        email: data.email,
        website: data.website,
        bio: data.bio,
        yearsExperience: data.yearsExperience,
        featured: data.featured,
        status: data.status,
        searchText,
        publishedAt: data.status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
        ...nestedWrites(data),
      },
      select: { id: true },
    });
  });
}

export async function patchArtisan(id: string, patch: { status?: ArtisanStatus; featured?: boolean }) {
  const existing = await prisma.artisan.findUnique({ where: { id }, select: { publishedAt: true } });
  if (!existing) return null;
  return prisma.artisan.update({
    where: { id },
    data: {
      ...patch,
      ...(patch.status === "PUBLISHED" && !existing.publishedAt ? { publishedAt: new Date() } : {}),
    },
    select: { id: true, status: true, featured: true },
  });
}

/** Delete an artisan (cascade services/photos, quotes keep a name snapshot) and its uploaded files. */
export async function deleteArtisan(id: string) {
  const existing = await prisma.artisan.findUnique({ where: { id }, include: { photos: true } });
  if (!existing) return false;
  await prisma.artisan.delete({ where: { id } });
  await Promise.all(
    existing.photos
      .filter((p) => p.url.startsWith("/api/uploads/"))
      .map((p) => unlink(path.join(UPLOAD_DIR, path.basename(p.url))).catch(() => undefined)),
  );
  return true;
}
