import "server-only";
import { prisma } from "../prisma";
import type { Locale, QuoteStatus } from "../constants";
import { localName } from "../i18n";

/** Admin dashboard KPIs & chart data — all values computed live from the DB. */
export async function getAdminStats(locale: Locale) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    totalArtisans,
    publishedArtisans,
    totalQuotes,
    pendingQuotes,
    inProgressQuotes,
    forwardedQuotes,
    processedQuotes,
    quotesThisMonth,
    recentQuoteDates,
    countries,
    artisanCountries,
    quotesPerArtisan,
    latest,
  ] = await Promise.all([
    prisma.artisan.count(),
    prisma.artisan.count({ where: { status: "PUBLISHED" } }),
    prisma.quoteRequest.count(),
    prisma.quoteRequest.count({ where: { status: "PENDING" } }),
    prisma.quoteRequest.count({ where: { status: "IN_PROGRESS" } }),
    prisma.quoteRequest.count({ where: { status: "FORWARDED" } }),
    prisma.quoteRequest.count({ where: { status: "PROCESSED" } }),
    prisma.quoteRequest.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.quoteRequest.findMany({ where: { createdAt: { gte: rangeStart } }, select: { createdAt: true } }),
    prisma.country.findMany(),
    prisma.artisan.findMany({ select: { id: true, countryId: true } }),
    prisma.quoteRequest.groupBy({ by: ["artisanId"], _count: { _all: true } }),
    prisma.quoteRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        reference: true,
        clientName: true,
        artisanName: true,
        status: true,
        forwardedToArtisan: true,
        createdAt: true,
      },
    }),
  ]);

  // Monthly series (12 buckets, oldest → newest).
  const monthly: { month: string; label: string; count: number }[] = [];
  const fmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { month: "short" });
  for (let i = 0; i < 12; i++) {
    const d = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + i, 1);
    monthly.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${fmt.format(d).replace(".", "")} ${String(d.getFullYear()).slice(2)}`,
      count: 0,
    });
  }
  for (const { createdAt } of recentQuoteDates) {
    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = monthly.find((m) => m.month === key);
    if (bucket) bucket.count += 1;
  }

  // Distribution by country (artisans + quote requests received by those artisans).
  const countryOfArtisan = new Map(artisanCountries.map((a) => [a.id, a.countryId]));
  const artisansByCountry = new Map<number, number>();
  for (const a of artisanCountries) artisansByCountry.set(a.countryId, (artisansByCountry.get(a.countryId) ?? 0) + 1);
  const quotesByCountry = new Map<number, number>();
  for (const g of quotesPerArtisan) {
    const cId = g.artisanId ? countryOfArtisan.get(g.artisanId) : undefined;
    if (cId !== undefined) quotesByCountry.set(cId, (quotesByCountry.get(cId) ?? 0) + g._count._all);
  }
  const byCountry = countries
    .map((c) => ({
      countryId: c.id,
      code: c.code,
      name: localName(c, locale),
      artisans: artisansByCountry.get(c.id) ?? 0,
      quotes: quotesByCountry.get(c.id) ?? 0,
    }))
    .filter((c) => c.artisans > 0 || c.quotes > 0)
    .sort((a, b) => b.artisans - a.artisans || b.quotes - a.quotes);

  return {
    kpis: {
      totalArtisans,
      publishedArtisans,
      totalQuotes,
      pendingQuotes,
      processedQuotes,
      inProgressQuotes,
      forwardedQuotes,
      quotesThisMonth,
      processingRate: totalQuotes ? Math.round((processedQuotes / totalQuotes) * 100) : 0,
    },
    monthly,
    byCountry,
    latest: latest.map((q) => ({ ...q, status: q.status as QuoteStatus })),
  };
}
export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>;
