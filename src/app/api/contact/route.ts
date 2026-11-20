import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Public contact-form endpoint.
 *
 * Security model:
 * - Runs server-side only; the service-role Supabase key and any email
 *   provider credentials never reach the browser.
 * - Input is validated and sanitized (length caps, email format, reason
 *   must be one of the approved options).
 * - Duplicate-submission guard: identical payload (hash) within 10 minutes
 *   is rejected, plus a simple per-IP rate limit.
 * - Spam protection: a honeypot field ("website") must stay empty.
 * - The inquiry row is saved FIRST; the email notification afterwards.
 *   A failed email is recorded on the row (email_status/email_error) and
 *   never loses the inquiry — success is still returned to the visitor
 *   with a note.
 * - No anon policies exist on contact_inquiries, so anonymous visitors can
 *   neither read other customers' inquiries nor insert rows directly.
 */

const ALLOWED_REASONS = [
  "General Inquiry",
  "Product Inquiry",
  "LPG Supply",
  "Haulage and Transportation",
  "Consultancy",
  "LPG Plant Installation",
  "Gas Delivery",
  "Repairs",
  "Weighbridge",
  "Safety Training",
  "Other",
] as const;

const MAX_NAME = 120;
const MAX_MESSAGE = 4000;

// Very small in-memory sliding-window rate limit. Fine for a single
// Next.js server instance; Redis would be needed for multi-instance.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const DUPLICATE_WINDOW_MS = 10 * 60_000;

const rateBuckets = new Map<string, number[]>();
const recentHashes = new Map<string, number>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (rateBuckets.get(key) ?? []).filter(
    (time) => now - time < RATE_LIMIT_WINDOW_MS
  );
  hits.push(now);
  rateBuckets.set(key, hits);

  if (rateBuckets.size > 1000) rateBuckets.clear();

  return hits.length > RATE_LIMIT_MAX;
}

function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";

  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sendNotificationEmail(inquiry: {
  full_name: string;
  email: string;
  phone: string;
  reason: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.CONTACT_NOTIFICATION_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL ?? "onboarding@resend.dev";

  // When email is not configured, the notification is simply skipped and
  // the row stays "pending" — visible to admins in the database.
  if (!apiKey || !notifyEmail) {
    return { ok: false, error: "Email notification not configured" };
  }

  const html = `
    <h2>New website inquiry — ${inquiry.reason}</h2>
    <p><strong>Name:</strong> ${inquiry.full_name}</p>
    <p><strong>Email:</strong> ${inquiry.email}</p>
    <p><strong>Phone:</strong> ${inquiry.phone}</p>
    <p><strong>Reason:</strong> ${inquiry.reason}</p>
    <p><strong>Message:</strong></p>
    <p>${inquiry.message.replace(/\n/g, "<br/>")}</p>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Regime Energy Website <${fromEmail}>`,
        to: [notifyEmail],
        reply_to: inquiry.email,
        subject: `Website inquiry: ${inquiry.reason} — ${inquiry.full_name}`,
        html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Resend notification failed:", response.status, body);
      return { ok: false, error: `Email provider error (${response.status})` };
    }

    return { ok: true };
  } catch (error) {
    console.error("Resend notification error:", error);
    return { ok: false, error: "Email provider unreachable" };
  }
}

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request format." },
      { status: 400 }
    );
  }

  // Honeypot — bots fill hidden fields; humans never see them.
  if (sanitizeText(payload.website, 200)) {
    return NextResponse.json({ success: true, message: "Thank you." });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many submissions. Please try again in a minute.",
      },
      { status: 429 }
    );
  }

  const fullName = sanitizeText(payload.full_name, MAX_NAME);
  const email = sanitizeText(payload.email, 254).toLowerCase();
  const phone = sanitizeText(payload.phone, 40);
  const reason = sanitizeText(payload.reason, 60);
  const message = sanitizeText(payload.message, MAX_MESSAGE);

  if (!fullName) {
    return NextResponse.json(
      { success: false, message: "Full name is required." },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { success: false, message: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  if (!phone) {
    return NextResponse.json(
      { success: false, message: "Phone number is required." },
      { status: 400 }
    );
  }

  if (!ALLOWED_REASONS.includes(reason as (typeof ALLOWED_REASONS)[number])) {
    return NextResponse.json(
      { success: false, message: "Please select a valid reason for inquiry." },
      { status: 400 }
    );
  }

  if (!message) {
    return NextResponse.json(
      { success: false, message: "Message is required." },
      { status: 400 }
    );
  }

  // Duplicate-submission guard on normalized payload content.
  const fingerprint = await sha256(`${fullName}|${email}|${reason}|${message}`);
  const now = Date.now();
  const lastSeen = recentHashes.get(fingerprint) ?? 0;

  if (now - lastSeen < DUPLICATE_WINDOW_MS) {
    return NextResponse.json(
      {
        success: false,
        message: "This inquiry was already submitted. We will get back to you shortly.",
      },
      { status: 409 }
    );
  }

  recentHashes.set(fingerprint, now);
  if (recentHashes.size > 1000) recentHashes.clear();

  let supabase;

  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json(
      { success: false, message: "Service temporarily unavailable." },
      { status: 503 }
    );
  }

  // 1. Persist the inquiry FIRST — this is the source of truth.
  const { data: saved, error: insertError } = await supabase
    .from("contact_inquiries")
    .insert({
      full_name: fullName,
      email,
      phone,
      reason,
      message,
    })
    .select("id")
    .single();

  if (insertError || !saved) {
    console.error("Contact inquiry save error:", insertError);

    return NextResponse.json(
      {
        success: false,
        message:
          "We could not save your inquiry right now. Please try again, or reach us on WhatsApp or by phone.",
      },
      { status: 500 }
    );
  }

  // 2. Email notification afterwards — failure is recorded on the row,
  //    never silently ignored, and never loses the saved inquiry.
  const notification = await sendNotificationEmail({
    full_name: fullName,
    email,
    phone,
    reason,
    message,
  });

  const emailStatus = notification.ok ? "sent" : notification.error === "Email notification not configured" ? "pending" : "failed";

  const { error: statusError } = await supabase
    .from("contact_inquiries")
    .update({
      email_status: emailStatus,
      email_error: notification.ok ? null : notification.error ?? "unknown",
    })
    .eq("id", saved.id);

  if (statusError) {
    console.error("Contact inquiry status update error:", statusError);
  }

  return NextResponse.json({
    success: true,
    message: notification.ok
      ? "Thank you! Your inquiry has been received — we will get back to you shortly."
      : "Thank you! Your inquiry has been received — we will get back to you shortly. (Email notification is delayed; our team can also see your message directly.)",
  });
}
