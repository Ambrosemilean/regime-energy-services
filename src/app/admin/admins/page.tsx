import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminsManager from "./admins-manager";

export default async function AdminManagementPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!me || !me.is_active || me.role !== "super_admin") {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Management
            </h1>

            <p className="mt-3 text-gray-600">
              Only super admins can manage administrators. Please
              contact a super admin if you need access.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { data: admins, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active, created_at")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600">
          REGIME ENERGY SERVICES
        </p>

        <h1 className="mt-1 text-3xl font-bold text-gray-900">
          Admin Management
        </h1>

        <p className="mt-2 text-gray-600">
          Manage administrator roles and access. New admin accounts
          are created by adding a user in the Supabase Dashboard
          (Authentication → Users), then their profile appears here.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Unable to load administrator profiles.
        </div>
      )}

      <AdminsManager
        admins={admins ?? []}
        currentUserId={user.id}
      />
    </div>
  );
}
