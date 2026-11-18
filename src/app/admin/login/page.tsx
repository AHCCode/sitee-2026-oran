import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { next } = await searchParams;
  if (user && user.role === "ADMIN") {
    redirect(next && next.startsWith("/admin") ? next : "/admin");
  }
  return <AdminLoginForm nextUrl={next ?? "/admin"} />;
}
