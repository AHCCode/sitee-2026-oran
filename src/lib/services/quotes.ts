import "server-only";
import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma";
import {
  ADMIN_PAGE_SIZE,
  MAX_PAGE_SIZE,
  QUOTE_STATUSES,
  type Locale,
  type QuoteEventType,
  type QuoteStatus,
} from "../constants";
import { localName } from "../i18n";
import type { QuoteUpdateInput } from "../validation";

type QuoteCreateData = {
  artisanId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  subject: string;
  description: string;
  budget: string | null;
};

/** DEV-YYYY-NNNN, sequential per year (zero-padded to 4 digits). */
async function nextReference(tx: Prisma.TransactionClient, year: number, bump: number): Promise<string> {
  const prefix = `DEV-${year}-`;
  const last = await tx.quoteRequest.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: [{ createdAt: "desc" }, { reference: "desc" }],
    select: { reference: true },
  });
  const lastNum = last ? Number.parseInt(last.reference.slice(prefix.length), 10) || 0 : 0;
  return `${prefix}${String(lastNum + 1 + bump).padStart(4, "0")}`;
}

/**
 * Create a quote request for a PUBLISHED artisan.
 * Returns null when the artisan doesn't exist or isn't published.
 */
export async function createQuote(data: QuoteCreateData, locale: Locale) {
  const artisan = await prisma.artisan.findFirst({
    where: { id: data.artisanId, status: "PUBLISHED" },
    select: { id: true, fullName: true },
  });
  if (!artisan) return null;

  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const reference = await nextReference(tx, year, attempt);
        return tx.quoteRequest.create({
          data: {
            reference,
            publicToken: randomBytes(24).toString("base64url"),
            artisanId: artisan.id,
            artisanName: artisan.fullName,
            clientName: data.clientName,
            clientEmail: data.clientEmail,
            clientPhone: data.clientPhone,
            subject: data.subject,
            description: data.description,
            budget: data.budget,
            locale,
            status: "PENDING",
            events: { create: { type: "CREATED", toStatus: "PENDING" } },
          },
        });
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue;
      throw err;
    }
  }
  throw new Error("Could not allocate a unique quote reference");
}

/** Public confirmation lookup: requires the unguessable token returned at creation. */
export async function getQuoteConfirmation(reference: string, token: string, locale: Locale) {
  if (!/^DEV-\d{4}-\d{4,}$/.test(reference) || !token || token.length > 64) return null;
  const q = await prisma.quoteRequest.findUnique({
    where: { reference },
    include: { artisan: { include: { category: true, city: true, country: true } } },
  });
  if (!q || q.publicToken !== token) return null;
  return {
    reference: q.reference,
    status: q.status as QuoteStatus,
    createdAt: q.createdAt,
    clientName: q.clientName,
    clientEmail: q.clientEmail,
    clientPhone: q.clientPhone,
    subject: q.subject,
    description: q.description,
    budget: q.budget,
    artisan: q.artisan
      ? {
          id: q.artisan.id,
          fullName: q.artisan.fullName,
          category: localName(q.artisan.category, locale),
          location: `${q.artisan.city.name}, ${localName(q.artisan.country, locale)}`,
          published: q.artisan.status === "PUBLISHED",
        }
      : { id: null, fullName: q.artisanName, category: null, location: null, published: false },
  };
}

/* ---------------------------------- Admin ---------------------------------- */

const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

export const adminQuoteQuerySchema = z.object({
  status: z.preprocess(emptyToUndefined, z.enum([...QUOTE_STATUSES, "ALL"]).optional()),
  q: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  forwarded: z.preprocess(emptyToUndefined, z.enum(["true", "false"]).optional()),
  artisanId: z.preprocess(emptyToUndefined, z.string().max(64).optional()),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(10_000).optional()),
  pageSize: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional()),
});

export async function listAdminQuotes(q: z.infer<typeof adminQuoteQuerySchema>) {
  const pageSize = q.pageSize ?? ADMIN_PAGE_SIZE;
  const base: Prisma.QuoteRequestWhereInput = {};
  if (q.q) {
    const term = q.q;
    base.OR = [
      { reference: { contains: term } },
      { clientName: { contains: term } },
      { clientEmail: { contains: term } },
      { artisanName: { contains: term } },
      { subject: { contains: term } },
    ];
  }
  if (q.forwarded) base.forwardedToArtisan = q.forwarded === "true";
  if (q.artisanId) base.artisanId = q.artisanId;
  const where: Prisma.QuoteRequestWhereInput = { ...base };
  if (q.status && q.status !== "ALL") where.status = q.status;

  const [total, groups] = await Promise.all([
    prisma.quoteRequest.count({ where }),
    prisma.quoteRequest.groupBy({ by: ["status"], where: base, _count: { _all: true } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(q.page ?? 1, totalPages);
  const rows = await prisma.quoteRequest.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      reference: true,
      clientName: true,
      clientEmail: true,
      artisanId: true,
      artisanName: true,
      subject: true,
      status: true,
      forwardedToArtisan: true,
      createdAt: true,
    },
  });
  const statusCounts = Object.fromEntries([...QUOTE_STATUSES, "ALL"].map((s) => [s, 0])) as Record<
    QuoteStatus | "ALL",
    number
  >;
  for (const g of groups) {
    statusCounts[g.status as QuoteStatus] = g._count._all;
    statusCounts.ALL += g._count._all;
  }
  return { items: rows, total, page, pageSize, totalPages, statusCounts };
}

export async function getAdminQuote(id: string, locale: Locale) {
  const q = await prisma.quoteRequest.findUnique({
    where: { id },
    include: {
      artisan: { include: { category: true, city: true, country: true } },
      events: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
    },
  });
  if (!q) return null;
  return {
    id: q.id,
    reference: q.reference,
    status: q.status as QuoteStatus,
    clientName: q.clientName,
    clientEmail: q.clientEmail,
    clientPhone: q.clientPhone,
    subject: q.subject,
    description: q.description,
    budget: q.budget,
    locale: q.locale,
    internalNotes: q.internalNotes,
    forwardedToArtisan: q.forwardedToArtisan,
    forwardedAt: q.forwardedAt,
    processedAt: q.processedAt,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
    artisan: q.artisan
      ? {
          id: q.artisan.id,
          fullName: q.artisan.fullName,
          phone: q.artisan.phone,
          email: q.artisan.email,
          status: q.artisan.status,
          category: localName(q.artisan.category, locale),
          location: `${q.artisan.city.name}, ${localName(q.artisan.country, locale)}`,
        }
      : null,
    artisanName: q.artisanName,
    history: q.events.map((e) => ({
      id: e.id,
      type: e.type as QuoteEventType,
      fromStatus: e.fromStatus as QuoteStatus | null,
      toStatus: e.toStatus as QuoteStatus | null,
      message: e.message,
      userName: e.user?.name ?? null,
      createdAt: e.createdAt,
    })),
  };
}
export type AdminQuoteDTO = NonNullable<Awaited<ReturnType<typeof getAdminQuote>>>;

/**
 * Apply an admin update and record history events atomically.
 * Business rules:
 *  - setting status FORWARDED also flags `forwardedToArtisan`;
 *  - flagging `forwardedToArtisan` on a PENDING / IN_PROGRESS request moves it to FORWARDED;
 *  - `processedAt` is set when status becomes PROCESSED.
 */
export async function updateQuote(id: string, input: QuoteUpdateInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    const q = await tx.quoteRequest.findUnique({ where: { id } });
    if (!q) return false;
    const now = new Date();
    const data: Prisma.QuoteRequestUpdateInput = {};
    const events: Prisma.QuoteEventCreateManyInput[] = [];

    let status = input.status;
    let forwarded = input.forwardedToArtisan;
    if (status === "FORWARDED" && forwarded === undefined && !q.forwardedToArtisan) forwarded = true;
    if (forwarded === true && status === undefined && (q.status === "PENDING" || q.status === "IN_PROGRESS")) {
      status = "FORWARDED";
    }

    if (forwarded !== undefined && forwarded !== q.forwardedToArtisan) {
      data.forwardedToArtisan = forwarded;
      data.forwardedAt = forwarded ? now : null;
      events.push({ quoteId: id, userId, type: forwarded ? "FORWARDED" : "UNFORWARDED", createdAt: now });
    }
    if (status && status !== q.status) {
      data.status = status;
      data.processedAt = status === "PROCESSED" ? now : null;
      events.push({ quoteId: id, userId, type: "STATUS_CHANGED", fromStatus: q.status, toStatus: status, createdAt: now });
    }
    if (input.internalNotes !== undefined && input.internalNotes.trim() !== q.internalNotes) {
      data.internalNotes = input.internalNotes.trim();
      events.push({ quoteId: id, userId, type: "NOTE_UPDATED", createdAt: now });
    }

    if (events.length) {
      await tx.quoteRequest.update({ where: { id }, data });
      await tx.quoteEvent.createMany({ data: events });
    }
    return true;
  });
}
