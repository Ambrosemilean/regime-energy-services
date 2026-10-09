import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_ROLES = [
  "super_admin",
  "website_manager",
  "content_manager",
];

async function isAuthorizedAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, supabase };
  }

  const { data: isAdmin, error } = await supabase.rpc(
    "has_admin_role",
    {
      required_roles: ADMIN_ROLES,
    }
  );

  if (error || !isAdmin) {
    return { authorized: false, supabase };
  }

  return { authorized: true, supabase };
}

export async function POST(request: Request) {
  try {
    const { authorized, supabase } =
      await isAuthorizedAdmin();

    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const companyName = body.company_name?.trim();

    if (!companyName) {
      return NextResponse.json(
        { error: "Company name is required." },
        { status: 400 }
      );
    }

    const { data: existingProfile } = await supabase
      .from("company_profile")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        {
          error:
            "A company profile already exists. Use the update action instead.",
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("company_profile")
      .insert({
        company_name: companyName,
        tagline: body.tagline?.trim() || null,
        short_description:
          body.short_description?.trim() || null,
        full_description:
          body.full_description?.trim() || null,
        mission: body.mission?.trim() || null,
        vision: body.vision?.trim() || null,
        core_values: body.core_values?.trim() || null,
        phone: body.phone?.trim() || null,
        email: body.email?.trim() || null,
        whatsapp: body.whatsapp?.trim() || null,
        address: body.address?.trim() || null,
        logo_url: body.logo_url?.trim() || null,
        main_image_url:
          body.main_image_url?.trim() || null,
        is_active: body.is_active ?? true,
      })
      .select("*")
      .single();

    if (error) {
      console.error(
        "Company profile creation error:",
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: data,
    });
  } catch (error) {
    console.error(
      "Company profile POST error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to create company profile." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { authorized, supabase } =
      await isAuthorizedAdmin();

    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const companyName = body.company_name?.trim();

    if (!companyName) {
      return NextResponse.json(
        { error: "Company name is required." },
        { status: 400 }
      );
    }

    const { data: existingProfile, error: findError } =
      await supabase
        .from("company_profile")
        .select("id")
        .limit(1)
        .maybeSingle();

    if (findError) {
      console.error(
        "Company profile lookup error:",
        findError
      );

      return NextResponse.json(
        { error: findError.message },
        { status: 500 }
      );
    }

    if (!existingProfile) {
      return NextResponse.json(
        {
          error:
            "No company profile exists yet. Create the profile first.",
        },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("company_profile")
      .update({
        company_name: companyName,
        tagline: body.tagline?.trim() || null,
        short_description:
          body.short_description?.trim() || null,
        full_description:
          body.full_description?.trim() || null,
        mission: body.mission?.trim() || null,
        vision: body.vision?.trim() || null,
        core_values: body.core_values?.trim() || null,
        phone: body.phone?.trim() || null,
        email: body.email?.trim() || null,
        whatsapp: body.whatsapp?.trim() || null,
        address: body.address?.trim() || null,
        logo_url: body.logo_url?.trim() || null,
        main_image_url:
          body.main_image_url?.trim() || null,
        is_active: body.is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingProfile.id)
      .select("*")
      .single();

    if (error) {
      console.error(
        "Company profile update error:",
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: data,
    });
  } catch (error) {
    console.error(
      "Company profile PUT error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to update company profile." },
      { status: 500 }
    );
  }
}