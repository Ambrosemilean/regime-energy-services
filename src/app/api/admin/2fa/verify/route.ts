import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  TWO_FA_COOKIE,
  rateLimit,
  getClientIp,
  verifyChallengeCode,
  issueTwoFaToken,
  TOKEN_TTL_MS,
} from "@/lib/security/auth";

/**
 * POST — verify a 6-digit 2FA code for a pending challenge.
 * On success, sets the 2FA session cookie.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);

  const { ok } = rateLimit(`2fa-verify:${ip}`, 10, 5 * 60 * 1000);
  if (!ok) {
    return NextResponse.json(
      { error: "Too many verification attempts. Try again in a few minutes." },
      { status: 429 }
    );
  }

  let body: { challengeId?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { challengeId, code } = body;
  if (!challengeId || !code) {
    return NextResponse.json(
      { error: "challengeId and code are required." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const verified = verifyChallengeCode(challengeId, user.id, code);
  if (!verified) {
    return NextResponse.json(
      { error: "Invalid or expired code." },
      { status: 401 }
    );
  }

  const token = issueTwoFaToken(user.id);
  const cookieStore = await cookies();
  cookieStore.set(TWO_FA_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(TOKEN_TTL_MS / 1000),
  });

  return NextResponse.json({ verified: true });
}
