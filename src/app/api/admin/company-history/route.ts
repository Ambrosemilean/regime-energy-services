import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_ROLES = [
  "super_admin",
  "website_manager",
  "content_manager",
];

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

// Create a history milestone
export async function POST(request: Request) {
  try {
    const supabase = await getAuthorizedSupabase();

    if (!supabase) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const year = body.year?.toString().trim();
    const title = body.title?.trim();

    if (!year || !title) {
      return NextResponse.json(
        { error: "Year and title are required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("company_history")
      .insert({
        year,
        title,
        description: body.description?.trim() || null,
        display_order: Number(body.display_order) || 0,
        is_active: body.is_active ?? true,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, milestone: data });
  } catch (error) {
    console.error("Company history POST error:", error);

    return NextResponse.json(
      { error: "Failed to create history milestone." },
      { status: 500 }
    );
  }
}

// Update a history milestone
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
    const id = body.id;

    if (!id) {
      return NextResponse.json(
        { error: "Milestone id is required." },
        { status: 400 }
      );
    }

    const year = body.year?.toString().trim();
    const title = body.title?.trim();

    if (!year || !title) {
      return NextResponse.json(
        { error: "Year and title are required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("company_history")
      .update({
        year,
        title,
        description: body.description?.trim() || null,
        display_order: Number(body.display_order) || 0,
        is_active: body.is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, milestone: data });
  } catch (error) {
    console.error("Company history PUT error:", error);

    return NextResponse.json(
      { error: "Failed to update history milestone." },
      { status: 500 }
    );
  }
}

// Delete a history milestone: /api/admin/company-history?id=...
export async function DELETE(request: Request) {
  try {
    const supabase = await getAuthorizedSupabase();

    if (!supabase) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const id = new URL(request.url).searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Milestone id is required." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("company_history")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Company history DELETE error:", error);

    return NextResponse.json(
      { error: "Failed to delete history milestone." },
      { status: 500 }
    );
  }
}
