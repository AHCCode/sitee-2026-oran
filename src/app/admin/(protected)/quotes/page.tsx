import { searchParamsToObject } from "@/lib/services/artisans";
import { adminQuoteQuerySchema, listAdminQuotes } from "@/lib/services/quotes";
import { AdminQuotesClient } from "@/components/admin/AdminQuotesClient";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminQuotesPage({ searchParams }: Props) {
  const raw = searchParamsToObject(await searchParams);
  const parsed = adminQuoteQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : {};

  const list = await listAdminQuotes(query);

  return (
    <AdminQuotesClient
      items={list.items}
      total={list.total}
      page={list.page}
      totalPages={list.totalPages}
      statusCounts={list.statusCounts}
      filters={{ status: query.status, q: query.q }}
      initialOpenId={raw.open}
    />
  );
}
