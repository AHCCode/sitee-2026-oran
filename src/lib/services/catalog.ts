import "server-only";
import { prisma } from "../prisma";
import type { Locale } from "../constants";
import { localName } from "../i18n";

export type CategoryDTO = {
  id: number;
  slug: string;
  name: string;
  nameFr: string;
  nameEn: string;
  icon: string;
  artisanCount: number;
};

export type CountryDTO = { id: number; code: string; name: string; nameFr: string; nameEn: string; cityCount: number };
export type CityDTO = { id: number; name: string; countryId: number; artisanCount: number };

/** All categories with the number of PUBLISHED artisans in each. */
export async function getCategoriesWithCounts(locale: Locale): Promise<CategoryDTO[]> {
  const rows = await prisma.category.findMany({
    include: { _count: { select: { artisans: { where: { status: "PUBLISHED" } } } } },
  });
  return rows
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: localName(c, locale),
      nameFr: c.nameFr,
      nameEn: c.nameEn,
      icon: c.icon,
      artisanCount: c._count.artisans,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

export async function getCountries(locale: Locale): Promise<CountryDTO[]> {
  const rows = await prisma.country.findMany({ include: { _count: { select: { cities: true } } } });
  return rows
    .map((c) => ({
      id: c.id,
      code: c.code,
      name: localName(c, locale),
      nameFr: c.nameFr,
      nameEn: c.nameEn,
      cityCount: c._count.cities,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

/** Cities of a country, or null when the country doesn't exist. */
export async function getCitiesOfCountry(countryId: number): Promise<CityDTO[] | null> {
  const country = await prisma.country.findUnique({ where: { id: countryId }, select: { id: true } });
  if (!country) return null;
  const rows = await prisma.city.findMany({
    where: { countryId },
    orderBy: { name: "asc" },
    include: { _count: { select: { artisans: { where: { status: "PUBLISHED" } } } } },
  });
  return rows.map((c) => ({ id: c.id, name: c.name, countryId: c.countryId, artisanCount: c._count.artisans }));
}

/** Public platform statistics — every number is a live DB count. */
export async function getPublicStats() {
  const published = { status: "PUBLISHED" };
  const [artisans, categories, countries, cities, quotes] = await Promise.all([
    prisma.artisan.count({ where: published }),
    prisma.category.count({ where: { artisans: { some: published } } }),
    prisma.country.count({ where: { artisans: { some: published } } }),
    prisma.city.count({ where: { artisans: { some: published } } }),
    prisma.quoteRequest.count(),
  ]);
  return { artisans, categories, countries, cities, quotes };
}
