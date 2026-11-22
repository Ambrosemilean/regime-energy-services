"use client";

import { FormEvent, useState } from "react";

/**
 * Footer contact form.
 *
 * Posts to /api/contact which validates, rate-limits, deduplicates and
 * stores the inquiry in Supabase (service-role), then emails the company.
 * The honeypot "website" field is hidden from humans via CSS and emptied
 * by browsers never (autocomplete off) — bots that fill it are dropped.
 */

const REASONS = [
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

const inputClass =
  "w-full rounded-lg border border-gray-600 bg-gray-900 px-4 py-2.5 text-sm text-white placeholder-gray-400 outline-none transition focus:border-regime-blue focus:ring-1 focus:ring-regime-blue";

const labelClass = "mb-1.5 block text-sm font-semibold text-white";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setFieldErrors({});

    const form = event.currentTarget;
    const formData = new FormData(form);

    // Client-side validation — mirrors the server rules so obvious errors
    // never round-trip.
    const errors: Record<string, string> = {};

    const fullName = String(formData.get("full_name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const reason = String(formData.get("reason") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!fullName) errors.full_name = "Full name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      errors.email = "Please enter a valid email address.";
    if (!phone) errors.phone = "Phone number is required.";
    if (!reason) errors.reason = "Please select a reason.";
    if (!message) errors.message = "Please write your message.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          reason,
          message,
          website: String(formData.get("website") || ""),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(
          result.message ||
          "Something went wrong. Please try again or contact us on WhatsApp."
        );
        return;
      }

      setSuccessMessage(result.message);
      form.reset();
    } catch {
      setErrorMessage(
        "Network error. Please check your connection and try again, or contact us on WhatsApp."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <h3 className="text-lg font-bold text-white">Send Us a Message</h3>

      {successMessage && (
        <div className="rounded-lg border border-green-700 bg-green-900/40 p-3 text-sm text-green-200">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg border border-red-800 bg-red-900/40 p-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className={labelClass}>
            Full Name *
          </label>

          <input
            id="cf-name"
            name="full_name"
            type="text"
            autoComplete="name"
            maxLength={120}
            className={inputClass}
            aria-invalid={Boolean(fieldErrors.full_name)}
          />

          {fieldErrors.full_name && (
            <p className="mt-1 text-xs text-red-300">{fieldErrors.full_name}</p>
          )}
        </div>

        <div>
          <label htmlFor="cf-email" className={labelClass}>
            Email Address *
          </label>

          <input
            id="cf-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            className={inputClass}
            aria-invalid={Boolean(fieldErrors.email)}
          />

          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-300">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="cf-phone" className={labelClass}>
            Phone Number *
          </label>

          <input
            id="cf-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
            className={inputClass}
            aria-invalid={Boolean(fieldErrors.phone)}
          />

          {fieldErrors.phone && (
            <p className="mt-1 text-xs text-red-300">{fieldErrors.phone}</p>
          )}
        </div>

        <div>
          <label htmlFor="cf-reason" className={labelClass}>
            Reason for Inquiry *
          </label>

          <select
            id="cf-reason"
            name="reason"
            defaultValue=""
            className={inputClass}
            aria-invalid={Boolean(fieldErrors.reason)}
          >
            <option value="" disabled>
              Select a reason
            </option>

            {REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>

          {fieldErrors.reason && (
            <p className="mt-1 text-xs text-red-300">{fieldErrors.reason}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="cf-message" className={labelClass}>
          Message *
        </label>

        <textarea
          id="cf-message"
          name="message"
          rows={4}
          maxLength={4000}
          className={inputClass}
          aria-invalid={Boolean(fieldErrors.message)}
        />

        {fieldErrors.message && (
          <p className="mt-1 text-xs text-red-300">{fieldErrors.message}</p>
        )}
      </div>

      {/* Honeypot — invisible to humans, tempting for bots. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="cf-website">Website</label>

        <input
          id="cf-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-regime-blue px-6 py-3 text-sm font-bold text-white transition hover:bg-regime-blue-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Sending..." : "Send Inquiry"}
      </button>
    </form>
  );
}