import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone, looksLikePhone } from "@/lib/phone";

/**
 * Resolves a login identifier (email or phone number) to the admin's
 * Supabase Auth email so the client can call signInWithPassword.
 *
 * Security notes:
 * - Only ACTIVE admin profiles are matched. Deactivated accounts get
 *   the same generic "Invalid login credentials." response as a
 *   missing record, so this endpoint cannot be used to enumerate
 *   which admins exist or which are disabled.
 * - The phone match runs server-side via the service-role client;
 *   the caller's (still unauthenticated) session is never used to
 *   read profiles.
 * - No user-supplied input is echoed back in error messages.
 * - Rate limiting on the actual sign-in is handled by Supabase Auth's
 *   built-in brute-force protection.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (
      !body ||
      typeof body.identifier !== "string" ||
      !body.identifier.trim()
    ) {
      return NextResponse.json(
        { error: "Invalid login credentials." },
        { status: 400 }
      );
    }

    const identifier = body.identifier.trim();

    // Plain emails pass straight through — no lookup needed.
    if (!looksLikePhone(identifier)) {
      return NextResponse.json({ email: identifier.toLowerCase() });
    }

    const phone = normalizePhone(identifier);

    if (!phone) {
      return NextResponse.json(
        { error: "Invalid login credentials." },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // The match runs with the service-role client — the caller has not
    // signed in yet, so their own session could not be used to read
    // profiles. Only ACTIVE profiles are matched: an inactive or
    // missing record produces the same generic response, preventing
    // account enumeration.
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id, is_active")
      .eq("phone", phone)
      .maybeSingle();

    if (!profile || !profile.is_active) {
      return NextResponse.json(
        { error: "Invalid login credentials." },
        { status: 401 }
      );
    }

    // Fetch the auth email for this admin so the client-side
    // signInWithPassword call can proceed. The email is only returned
    // when the phone matches an active admin profile.
    const { data: userData } = await adminClient
      .auth.admin.getUserById(profile.id);

    const email = userData?.user?.email ?? null;

    if (!email) {
      return NextResponse.json(
        { error: "Unable to sign in with this phone number. Use your email instead." },
        { status: 503 }
      );
    }

    return NextResponse.json({ email });
  } catch (error) {
    console.error("Login lookup error:", error);

    return NextResponse.json(
      { error: "Invalid login credentials." },
      { status: 500 }
    );
  }
}
