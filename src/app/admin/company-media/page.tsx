import { createClient } from "@/lib/supabase/server";
import CompanyMediaManager from "./company-media-manager";

export default async function CompanyMediaPage() {
  const supabase = await createClient();

  const { data: media, error } = await supabase
    .from("company_media")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Company media loading error:", error);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Company Media
        </h1>

        <p className="mt-2 text-gray-600">
          Manage the images used in the Regime Energy Services
          website slideshow.
        </p>
      </div>

      <CompanyMediaManager media={media ?? []} />
    </div>
  );
}