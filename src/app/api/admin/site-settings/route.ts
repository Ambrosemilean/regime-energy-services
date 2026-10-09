import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_ROLES = [
  "super_admin",
  "website_manager",
  "content_manager",
];

const URL_FIELDS = [
  "facebook_url",
  "instagram_url",
  "twitter_url",
  "linkedin_url",
  "youtube_url",
] as const;

const TEXT_FIELDS = [
  "footer_note",
  "meta_title",
  "meta_description",
] as const;

async function getAuthorizedSupabase() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: isAdmin } = await supabase.rpc("has_admin_role", {
    required_roles: ADMIN_ROLES,
  });

  if (!isAdmin) {
    return null;
  }

  return supabase;
}

type SiteSettingsValues = {
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  footer_note: string | null;
  meta_title: string | null;
  meta_description: string | null;
  show_company_history_link: boolean;
};

function buildValues(body: Record<string, unknown>): SiteSettingsValues {
  const values: SiteSettingsValues = {
    facebook_url: null,
    instagram_url: null,
    twitter_url: null,
    linkedin_url: null,
    youtube_url: null,
    footer_note: null,
    meta_title: null,
    meta_description: null,
    show_company_history_link: true,
  };

  for (const field of URL_FIELDS) {
    const raw = body[field]?.toString().trim() || "";
    values[field] =
      raw && /^https?:\/\//i.test(raw) ? raw : null;
  }

  for (const field of TEXT_FIELDS) {
    values[field] = body[field]?.toString().trim() || null;
  }

  values.show_company_history_link =
    typeof body.show_company_history_link === "boolean"
      ? body.show_company_history_link
      : true;

  return values;
}

// Save site settings (creates the single row if it does not exist yet)
export async function PUT(request: Request) {
  try {
    const supabase = await getAuthorizedSupabase();

    if (!supabase) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const values = buildValues(body);

    const { data: existing } = await supabase
      .from("site_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    const { data, error } = existing
      ? await supabase
          .from("site_settings")
          .update({
            ...values,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select("*")
          .single()
      : await supabase
          .from("site_settings")
          .insert({ ...values, is_active: true })
          .select("*")
          .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, settings: data });
  } catch (error) {
    console.error("Site settings PUT error:", error);

    return NextResponse.json(
      { error: "Failed to save site settings." },
      { status: 500 }
    );
  }
}
