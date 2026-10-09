import { createClient } from "@/lib/supabase/server";
import SiteSettingsForm from "./site-settings-form";

export default async function SiteSettingsPage() {
  const supabase = await createClient();

  const { data: settings, error } = await supabase
    .from("site_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600">
          REGIME ENERGY SERVICES
        </p>

        <h1 className="mt-1 text-3xl font-bold text-gray-900">
          Site Settings
        </h1>

        <p className="mt-2 text-gray-600">
          Manage global website settings — social media links,
          footer text and SEO metadata used across the public
          website.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Unable to load site settings. Make sure the{" "}
          <code>site_settings</code> table exists (see
          supabase/migrations).
        </div>
      )}

      <SiteSettingsForm settings={settings} />
    </div>
  );
}
