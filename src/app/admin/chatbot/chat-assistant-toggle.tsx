"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  /** Current visibility of the public chat assistant. */
  initialVisible: boolean;
  /** Full current site settings so the PUT request doesn't wipe other fields. */
  settings: Record<string, unknown> | null;
};

/**
 * Admin toggle that shows or hides the public chat assistant ("Regi")
 * on the website. Persists via the site-settings API.
 */
export default function ChatAssistantToggle({
  initialVisible,
  settings,
}: Props) { 
  const router = useRouter();

  const [visible, setVisible] = useState(initialVisible);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    const next = !visible;

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(settings || {}),
          show_chat_assistant: next,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update chat visibility.");
      }

      setVisible(next);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Chat Assistant Visibility
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {visible
              ? "The chat assistant is currently visible to visitors on the website."
              : "The chat assistant is currently hidden from visitors."}
          </p>

          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <button
          type="button"
          onClick={toggle}
          disabled={saving}
          aria-pressed={visible}
          className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow transition disabled:cursor-not-allowed disabled:opacity-50 ${visible
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
            }`}
        >
          {saving ? (
            "Saving…"
          ) : visible ? (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
              Hide from Website
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Show on Website
            </>
          )}
        </button>
      </div>
    </div>
  );
}
