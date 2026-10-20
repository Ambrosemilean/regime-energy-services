import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // The service-role key may not be configured (e.g. local dev).
  // Fall back to showing profiles without emails instead of crashing.
  let authUsers: { users: { id: string; email?: string | null }[] } | null =
    null;
  let configError = false;

  try {
    authUsers = (await createAdminClient().auth.admin.listUsers()).data;
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("environment variables")
    ) {
      configError = true;
    } else {
      throw err;
    }
  }

  const [{ data: admins, error }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, is_active, phone, created_at")
      .order("created_at", { ascending: true }),
  ]);

  const emailById = new Map(
    (authUsers?.users ?? []).map((u) => [u.id, u.email ?? null])
  );

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
          Manage administrator accounts: create new admins, assign
          roles, enable or disable access, and remove accounts.
          Passwords are stored securely by Supabase Auth.
        </p>
      </div>

      {configError && (
        <div className="rounded-xl bg-amber-50 p-5 text-sm text-amber-800">
          <p className="font-semibold">Supabase secret key not configured</p>
          <p className="mt-1">
            Add <code>SUPABASE_SECRET_KEY</code> to <code>.env.local</code> to
            load admin emails and enable adding/removing administrators.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Unable to load administrator profiles.
        </div>
      )}

      <AdminsManager
        admins={admins ?? []}
        emailById={Object.fromEntries(emailById)}
        currentUserId={user.id}
        superAdminCount={(admins ?? []).filter(
          (a) => a.role === "super_admin" && a.is_active
        ).length}
      />
    </div>
  );
}
