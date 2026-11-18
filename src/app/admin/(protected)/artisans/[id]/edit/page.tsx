import { notFound } from "next/navigation";
import { getI18n } from "@/lib/i18n/server";
import { getCategoriesWithCounts, getCitiesOfCountry, getCountries } from "@/lib/services/catalog";
import { getAdminArtisan } from "@/lib/services/artisans";
import { ArtisanForm } from "@/components/admin/ArtisanForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditArtisanPage({ params }: Props) {
  const { locale } = await getI18n();
  const { id } = await params;

  const artisan = await getAdminArtisan(id, locale);
  if (!artisan) notFound();

  const [categories, countries, initialCities] = await Promise.all([
    getCategoriesWithCounts(locale),
    getCountries(locale),
    getCitiesOfCountry(artisan.countryId),
  ]);

  return (
    <ArtisanForm
      mode="edit"
      initial={artisan}
      categories={categories}
      countries={countries}
      initialCities={initialCities ?? []}
    />
  );
}
