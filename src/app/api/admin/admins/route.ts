import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

// Create a new admin (Supabase Auth user + profile row).
// Password is set at creation; the service-role key stays server-side.
export async function POST(request: Request) {
  try {
    const supabase = await getSuperAdminSupabase();

    if (!supabase) {
      return NextResponse.json(
        { error: "Only super admins can manage administrators." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const username = typeof body.username === "string" ? body.username.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = typeof body.role === "string" ? body.role : "";

    if (!username) {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Create the auth user (Supabase Auth manages the password)
    const { data: created, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username, role },
      });

    if (createError || !created?.user) {
      return NextResponse.json(
        {
          error:
            createError?.message || "Failed to create the auth account.",
        },
        { status: createError?.status === 422 ? 409 : 500 }
      );
    }

    // 2. Create the matching profile row
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: created.user.id,
        full_name: username,
        role,
        is_active: true,
      })
      .select("id, full_name, role, is_active")
      .single();

    if (profileError) {
      // Roll back the auth user so we don't leave an orphaned account
      await adminClient.auth.admin.deleteUser(created.user.id);

      return NextResponse.json(
        { error: `Failed to create admin profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, admin: profile }, { status: 201 });
  } catch (error) {
    console.error("Admins POST error:", error);

    return NextResponse.json(
      { error: "Failed to create administrator." },
      { status: 500 }
    );
  }
}

// Remove an admin: delete the auth user (revokes access) and clean up
// the profile. Protected by the last-super-admin DB trigger.
export async function DELETE(request: Request) {
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

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "Admin id is required." }, { status: 400 });
    }

    if (currentUser && currentUser.id === body.id) {
      return NextResponse.json(
        { error: "You cannot remove your own account." },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 1. Revoke access — delete the Supabase Auth user
    const { error: deleteAuthError } =
      await adminClient.auth.admin.deleteUser(body.id);

    if (deleteAuthError) {
      return NextResponse.json(
        { error: `Failed to revoke account access: ${deleteAuthError.message}` },
        { status: 500 }
      );
    }

    // 2. Clean up the profile row (service-role key bypasses RLS;
    //    the last-super-admin trigger still applies)
    const { error: deleteProfileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", body.id);

    if (deleteProfileError) {
      return NextResponse.json(
        {
          error: `Account removed but profile cleanup failed: ${deleteProfileError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admins DELETE error:", error);

    return NextResponse.json(
      { error: "Failed to remove administrator." },
      { status: 500 }
    );
  }
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
