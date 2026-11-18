import { getI18n } from "@/lib/i18n/server";
import { getCategoriesWithCounts, getCountries } from "@/lib/services/catalog";
import { ArtisanForm } from "@/components/admin/ArtisanForm";

export const dynamic = "force-dynamic";

export default async function NewArtisanPage() {
  const { locale } = await getI18n();
  const [categories, countries] = await Promise.all([
    getCategoriesWithCounts(locale),
    getCountries(locale),
  ]);

  return <ArtisanForm mode="create" categories={categories} countries={countries} />;
}
