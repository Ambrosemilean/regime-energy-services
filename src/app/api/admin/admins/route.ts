import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_ROLES = [
  "super_admin",
  "website_manager",
  "content_manager",
  "viewer",
];

async function getSuperAdminSupabase() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: isAdmin } = await supabase.rpc("has_admin_role", {
    required_roles: ["super_admin"],
  });

  if (!isAdmin) {
    return null;
  }

  return supabase;
}

// Update an admin's role / active status
export async function PATCH(request: Request) {
  try {
    const supabase = await getSuperAdminSupabase();

    if (!supabase) {
      return NextResponse.json(
        { error: "Only super admins can manage administrators." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    // Prevent a super admin from locking themselves out
    if (currentUser && currentUser.id === body.id) {
      return NextResponse.json(
        { error: "You cannot modify your own account here." },
        { status: 400 }
      );
    }

    const updates: Record<string, string | boolean> = {};

    if (body.role !== undefined) {
      if (!VALID_ROLES.includes(body.role)) {
        return NextResponse.json(
          { error: "Invalid role." },
          { status: 400 }
        );
      }

      updates.role = body.role;
    }

    if (body.is_active !== undefined) {
      updates.is_active = Boolean(body.is_active);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", body.id)
      .select("id, full_name, role, is_active")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, admin: data });
  } catch (error) {
    console.error("Admins PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update administrator." },
      { status: 500 }
    );
  }
}
