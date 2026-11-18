import { getI18n } from "@/lib/i18n/server";
import { getCategoriesWithCounts, getCountries } from "@/lib/services/catalog";
import {
  adminArtisanQuerySchema,
  listAdminArtisans,
  searchParamsToObject,
} from "@/lib/services/artisans";
import { AdminArtisansClient } from "@/components/admin/AdminArtisansClient";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminArtisansPage({ searchParams }: Props) {
  const { locale } = await getI18n();
  const raw = searchParamsToObject(await searchParams);
  const parsed = adminArtisanQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : {};

  const [categories, countries, list] = await Promise.all([
    getCategoriesWithCounts(locale),
    getCountries(locale),
    listAdminArtisans(query, locale),
  ]);

  return (
    <AdminArtisansClient
      items={list.items}
      total={list.total}
      page={list.page}
      totalPages={list.totalPages}
      statusCounts={list.statusCounts}
      categories={categories}
      countries={countries}
      filters={query}
    />
  );
}
