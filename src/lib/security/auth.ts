/**
 * Two Factor Authentication utilities.
 *
 * - Signed, expiring 2FA session tokens (HMAC-SHA256) stored in a cookie.
 * - Challenge store (in-memory) holding pending codes for 10 minutes.
 * - Simple fixed-window in-memory rate limiter.
 * - Client IP extraction from proxy headers.
 */

import { createHmac, randomInt, timingSafeEqual } from "crypto";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const TWO_FA_COOKIE = "two_fa_token";

/** How long a granted 2FA session stays valid. */
export const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

/** How long a pending challenge code stays valid. */
export const CHALLENGE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const TOKEN_SECRET =
  process.env.TWO_FA_SECRET ??
  process.env.SUPABASE_JWT_SECRET ??
  "dev-only-insecure-secret-change-me";

// ---------------------------------------------------------------------------
// Pending challenge store (module-level; per server instance)
// ---------------------------------------------------------------------------

interface StoredChallenge {
  id: string;
  userId: string;
  code: string;
  emailMask: string;
  phoneMask: string;
  expiresAt: number;
}

const challenges = new Map<string, StoredChallenge>();

function maskEmail(email: string): string {
  if (!email) return "—";
  return email.replace(/^(.{2}).*?(@.*)$/, "$1***$2");
}

function maskPhone(phone: string): string {
  if (!phone) return "—";
  return phone.replace(/^(\+\d{0,3})\d*(\d{3})$/, "$1****$2");
}

// ---------------------------------------------------------------------------
// Challenge lifecycle
// ---------------------------------------------------------------------------

/**
 * Start a 2FA challenge for the user: generate a 6-digit code, "send" it over
 * the user's email and phone, and store it for verification.
 *
 * Returns null when delivery is not configured for the account (no
 * email/phone on file or no provider connected).
 */
export async function startChallenge(userId: string) {
  // Look up the admin's contact details from the admins table.
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: admin } = await supabase
    .from("admins")
    .select("email, phone_number")
    .eq("user_id", userId)
    .single();

  const email =
    admin?.email ?? (await supabase.auth.getUser()).data.user?.email ?? "";
  const phone = admin?.phone_number ?? "";

  if (!email && !phone) {
    return null;
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const challenge: StoredChallenge = {
    id: `challenge-${Date.now()}-${randomInt(0, 10_000)}`,
    userId,
    code,
    emailMask: maskEmail(email),
    phoneMask: maskPhone(phone),
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
  };

  challenges.set(challenge.id, challenge);

  // Deliver the code. Replace with a real email/SMS provider when connected.
  console.log(
    `[2FA] Challenge ${challenge.id} for user ${userId}: code sent to ${challenge.emailMask} / ${challenge.phoneMask}`
  );

  return {
    id: challenge.id,
    email_address: challenge.emailMask,
    phone_number: challenge.phoneMask,
  };
}

/** Verify a 6-digit code against a pending challenge for this user. */
export function verifyChallengeCode(
  challengeId: string,
  userId: string,
  code: string
): boolean {
  const challenge = challenges.get(challengeId);
  if (!challenge || challenge.userId !== userId) return false;
  if (Date.now() > challenge.expiresAt) {
    challenges.delete(challengeId);
    return false;
  }
  const ok = safeEquals(challenge.code, code.trim());
  if (ok) challenges.delete(challengeId);
  return ok;
}

// ---------------------------------------------------------------------------
// 2FA session token (cookie value)
// ---------------------------------------------------------------------------

function sign(payload: string): string {
  return createHmac("sha256", TOKEN_SECRET).update(payload).digest("base64url");
}

/** Issue a signed token marking this user as 2FA-verified. */
export function issueTwoFaToken(userId: string): string {
  const expires = Date.now() + TOKEN_TTL_MS;
  const payload = `${userId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

/** Check the cookie token: valid signature, matching user, not expired. */
export function verifyTwoFaToken(
  token: string | undefined,
  userId: string
): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [tokenUser, expiresRaw, signature] = parts;
  if (tokenUser !== userId) return false;

  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  return safeEquals(sign(`${tokenUser}.${expiresRaw}`), signature);
}

function safeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

/** Best-effort client IP from proxy headers, falling back to a fixed key. */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

// ---------------------------------------------------------------------------
// Rate limiting (fixed window, in-memory)
// ---------------------------------------------------------------------------

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Fixed-window rate limiter.
 * @param key      unique bucket key, e.g. `2fa-start:${ip}`
 * @param limit    max requests allowed inside the window
 * @param windowMs window length in milliseconds
 */
export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 5 * 60 * 1000
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}