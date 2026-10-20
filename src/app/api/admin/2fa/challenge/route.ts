import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  startChallenge,
  rateLimit,
  getClientIp,
  TWO_FA_COOKIE,
  verifyTwoFaToken,
} from "@/lib/security/auth";

/**
 * GET  — status: has the current signed-in admin completed 2FA?
 * POST — start a new 2FA challenge (sends codes to email + phone).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const token = cookieStore.get(TWO_FA_COOKIE)?.value;

  const verified = Boolean(user && verifyTwoFaToken(token, user.id));

  return NextResponse.json({ verified });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  const { ok } = rateLimit(`2fa-start:${ip}`, 5, 5 * 60 * 1000);
  if (!ok) {
    return NextResponse.json(
      { error: "Too many verification attempts. Try again in a few minutes." },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const challenge = await startChallenge(user.id);

  if (!challenge) {
    return NextResponse.json(
      {
        error:
          "Two-factor delivery is not configured for this account yet. A super admin must set the phone number and an email/SMS provider must be connected.",
      },
      { status: 400 }
    );
  }

  const emailMask = challenge.email_address.replace(/^(.{2}).*?(@.*)$/, "$1***$2");
  const phoneMask = challenge.phone_number.replace(/^(\+\d{0,3})\d*(\d{3})$/, "$1****$2");

  return NextResponse.json({
    challengeId: challenge.id,
    emailHint: emailMask,
    phoneHint: phoneMask,
    expiresInMinutes: 10,
  });
}
