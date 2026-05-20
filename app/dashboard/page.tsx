import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.isAdmin) notFound();
  redirect("/admin");
}
