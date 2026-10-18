"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Lightweight first-party analytics tracker.
 * - Records one page view per navigation (public site only).
 * - Sends a heartbeat so the dashboard can show live visitors.
 * - Exposes a global `trackEvent()` helper for click tracking.
 *
 * Requires the tables from supabase/migrations/20261012_website_analytics.sql.
 */

const VISITOR_KEY = "regime_visitor_id";
const SESSION_KEY = "regime_session_id";

function getOrCreateId(storageKey: string): string {
  let value = "";

  try {
    value = window.localStorage.getItem(storageKey) || "";
  } catch {
    // Storage can be unavailable in private mode — fall back to memory.
  }

  if (!value) {
    value =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      window.localStorage.setItem(storageKey, value);
    } catch {
      // Ignore — a per-page-load id is fine.
    }
  }

  return value;
}

function classifySource(referrer: string, path: string): string {
  if (path.startsWith("/admin")) {
    return "internal";
  }

  if (!referrer) {
    return "direct";
  }

  let hostname = "";

  try {
    hostname = new URL(referrer).hostname;
  } catch {
    return "direct";
  }

  if (hostname.includes("google.") || hostname.includes("bing.") || hostname.includes("duckduckgo.")) {
    return "google";
  }

  if (
    hostname.includes("facebook.") ||
    hostname.includes("instagram.") ||
    hostname.includes("twitter.") ||
    hostname.includes("x.com") ||
    hostname.includes("linkedin.") ||
    hostname.includes("tiktok.") ||
    hostname.includes("youtube.") ||
    hostname.includes("wa.me") ||
    hostname.includes("whatsapp.")
  ) {
    return "social";
  }

  if (hostname === window.location.hostname) {
    return "internal";
  }

  return "referral";
}

function detectDevice(): string {
  const ua = navigator.userAgent;

  if (/iPad|Tablet/i.test(ua)) {
    return "tablet";
  }

  if (/Mobi|Android|iPhone/i.test(ua)) {
    return "mobile";
  }

  return "desktop";
}

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) {
      return;
    }

    const visitorId = getOrCreateId(VISITOR_KEY);
    const sessionId = getOrCreateId(SESSION_KEY);
    const referrer = document.referrer || "";
    const source = classifySource(referrer, pathname);
    const device = detectDevice();

    // New visit: start a fresh session id and record the view.
    if (
      typeof window !== "undefined" &&
      (window.performance?.navigation?.type === 1 || sessionStorage.getItem(SESSION_KEY))
    ) {
      // Reload or existing session — keep it.
    } else {
      try {
        sessionStorage.setItem(SESSION_KEY, sessionId);
      } catch {
        // Ignore.
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    async function post(table: string, body: Record<string, unknown>) {
      if (!supabaseUrl || !supabaseAnonKey) {
        return;
      }

      try {
        await fetch(`${supabaseUrl}/rest/v1/${table}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify(body),
        });
      } catch {
        // Analytics must never break the site.
      }
    }

    async function trackPageView() {
      await post("site_page_views", {
        visitor_id: visitorId,
        session_id: sessionId,
        path: pathname,
        referrer,
        source,
        device,
      });
    }

    async function heartbeat() {
      await post("live_sessions", {
        visitor_id: visitorId,
        session_id: sessionId,
        path: pathname,
      });
    }

    trackPageView();
    heartbeat();

    const interval = window.setInterval(heartbeat, 60_000);

    // Expose the click-tracking helper used across the site.
    (window as unknown as Record<string, unknown>).trackEvent = (
      eventType: string,
      label?: string
    ) => {
      void post("site_events", {
        visitor_id: visitorId,
        session_id: sessionId,
        path: pathname,
        event_type: eventType,
        label: label || null,
      });
    };

    return () => {
      window.clearInterval(interval);
    };
  }, [pathname]);

  return null;
}

/**
 * Fire an engagement event (phone click, WhatsApp click, maps directions…).
 * Safe to call from any client component.
 */
export function trackEvent(eventType: string, label?: string) {
  if (typeof window === "undefined") {
    return;
  }

  const helper = (window as unknown as Record<string, unknown>).trackEvent;

  if (typeof helper === "function") {
    (helper as (type: string, label?: string) => void)(eventType, label);
  }
}
