import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  const { t } = await getI18n();

  if (user.role !== "ADMIN") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <ShieldAlert className="h-7 w-7" />
        </span>
        <h1 className="font-display text-2xl font-bold text-earth-900">{t.admin.forbidden.title}</h1>
        <p className="mt-2 text-sm text-earth-600">{t.admin.forbidden.text}</p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {t.common.backHome}
          </Link>
        </div>
      </div>
    );
  }

  const pendingQuotesCount = await prisma.quoteRequest.count({ where: { status: "PENDING" } });

  return (
    <div className="min-h-screen bg-earth-50">
      <AdminSidebar user={user} pendingQuotesCount={pendingQuotesCount} />
      <div className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
