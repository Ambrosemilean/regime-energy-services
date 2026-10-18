import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnalyticsDashboard from "./analytics-dashboard";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  return <AnalyticsDashboard />;
}
