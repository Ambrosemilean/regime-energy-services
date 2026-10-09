import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  const formattedRole = profile.role
  .replaceAll("_", " ")
  .replace(/\b\w/g, (letter: string) => letter.toUpperCase());
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">
            REGIME ENERGY SERVICES
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-gray-600">
            Welcome back, {profile.full_name || "Administrator"}.
          </p>
        </div>

        {/* Admin Information */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Administrator Information
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Name</p>
              <p className="mt-1 font-semibold text-gray-900">
                {profile.full_name || "Administrator"}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Role</p>
              <p className="mt-1 font-semibold capitalize text-gray-900">
                {formattedRole}
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Overview */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Website Overview
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              title="Products"
              description="Manage Regime products"
              href="/admin/products"
            />

            <DashboardCard
              title="Services"
              description="Manage company services"
              href="/admin/services"
            />

            <DashboardCard
              title="Branches"
              description="Manage branch information"
              href="/admin/branches"
            />

            <DashboardCard
              title="Site Settings"
              description="Manage global website settings"
              href="/admin/site-settings"
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function DashboardCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <h3 className="font-semibold text-gray-900">
        {title}
      </h3>

      <p className="mt-2 text-sm text-gray-500">
        {description}
      </p>

      <p className="mt-4 text-sm font-medium text-blue-600">
        Manage →
      </p>
    </a>
  );
}