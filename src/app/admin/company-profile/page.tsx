import { createClient } from "@/lib/supabase/server";
import CompanyProfileForm from "./company-profile-form";
import CompanyMediaManager from "../company-media/company-media-manager";

export default async function CompanyProfilePage() {
  const supabase = await createClient();

  // Load company profile
  const { data: profile, error: profileError } = await supabase
    .from("company_profile")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (profileError) {
    console.error(
      "Company profile loading error:",
      profileError
    );
  }

  // Load company slideshow images
  const { data: media, error: mediaError } = await supabase
    .from("company_media")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (mediaError) {
    console.error(
      "Company media loading error:",
      mediaError
    );
  }

  return (
    <div className="space-y-10">
      {/* Company Profile */}
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Company Profile
          </h1>

          <p className="mt-2 text-gray-600">
            Manage Regime Energy Services company information
            displayed throughout the website.
          </p>
        </div>

        <CompanyProfileForm profile={profile} />
      </div>

      {/* Company Images */}
      <div className="border-t border-gray-200 pt-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Company Images & Slideshow
          </h2>

          <p className="mt-2 text-gray-600">
            Upload and manage multiple images that will be used
            throughout the Regime Energy Services website,
            including the homepage slideshow.
          </p>
        </div>

        <CompanyMediaManager media={media ?? []} />
      </div>
    </div>
  );
}