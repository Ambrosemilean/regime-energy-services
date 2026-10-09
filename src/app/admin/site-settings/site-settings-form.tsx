"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SiteSettings = {
  id: string;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  footer_note: string | null;
  meta_title: string | null;
  meta_description: string | null;
  show_company_history_link: boolean;
};

export default function SiteSettingsForm({
  settings,
}: {
  settings: SiteSettings | null;
}) {
  const router = useRouter();

  const [facebookUrl, setFacebookUrl] = useState(
    settings?.facebook_url || ""
  );
  const [instagramUrl, setInstagramUrl] = useState(
    settings?.instagram_url || ""
  );
  const [twitterUrl, setTwitterUrl] = useState(
    settings?.twitter_url || ""
  );
  const [linkedinUrl, setLinkedinUrl] = useState(
    settings?.linkedin_url || ""
  );
  const [youtubeUrl, setYoutubeUrl] = useState(
    settings?.youtube_url || ""
  );
  const [footerNote, setFooterNote] = useState(
    settings?.footer_note || ""
  );
  const [metaTitle, setMetaTitle] = useState(
    settings?.meta_title || ""
  );
  const [metaDescription, setMetaDescription] = useState(
    settings?.meta_description || ""
  );
  const [showHistoryLink, setShowHistoryLink] = useState(
    settings?.show_company_history_link ?? true
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facebook_url: facebookUrl,
          instagram_url: instagramUrl,
          twitter_url: twitterUrl,
          linkedin_url: linkedinUrl,
          youtube_url: youtubeUrl,
          footer_note: footerNote,
          meta_title: metaTitle,
          meta_description: metaDescription,
          show_company_history_link: showHistoryLink,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to save site settings."
        );
      }

      setSuccess("Site settings saved successfully.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Social media */}
      <div className="rounded-xl border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Social Media Links
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          These links appear in the footer of the public website.
          Leave a field empty to hide that icon.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="facebook_url" className="mb-2 block text-sm font-medium text-gray-700">
              Facebook URL
            </label>

            <input
              id="facebook_url"
              type="url"
              value={facebookUrl}
              onChange={(event) => setFacebookUrl(event.target.value)}
              placeholder="https://facebook.com/..."
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="instagram_url" className="mb-2 block text-sm font-medium text-gray-700">
              Instagram URL
            </label>

            <input
              id="instagram_url"
              type="url"
              value={instagramUrl}
              onChange={(event) => setInstagramUrl(event.target.value)}
              placeholder="https://instagram.com/..."
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="twitter_url" className="mb-2 block text-sm font-medium text-gray-700">
              X / Twitter URL
            </label>

            <input
              id="twitter_url"
              type="url"
              value={twitterUrl}
              onChange={(event) => setTwitterUrl(event.target.value)}
              placeholder="https://x.com/..."
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="linkedin_url" className="mb-2 block text-sm font-medium text-gray-700">
              LinkedIn URL
            </label>

            <input
              id="linkedin_url"
              type="url"
              value={linkedinUrl}
              onChange={(event) => setLinkedinUrl(event.target.value)}
              placeholder="https://linkedin.com/company/..."
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="youtube_url" className="mb-2 block text-sm font-medium text-gray-700">
              YouTube URL
            </label>

            <input
              id="youtube_url"
              type="url"
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
              placeholder="https://youtube.com/@..."
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Footer & SEO */}
      <div className="rounded-xl border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Footer &amp; SEO
        </h2>

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="footer_note" className="mb-2 block text-sm font-medium text-gray-700">
              Footer Note
            </label>

            <input
              id="footer_note"
              type="text"
              value={footerNote}
              onChange={(event) => setFooterNote(event.target.value)}
              placeholder="Reliable LPG energy solutions."
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="meta_title" className="mb-2 block text-sm font-medium text-gray-700">
              SEO Page Title
            </label>

            <input
              id="meta_title"
              type="text"
              value={metaTitle}
              onChange={(event) => setMetaTitle(event.target.value)}
              placeholder="Regime Energy Services — Reliable LPG Solutions"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="meta_description" className="mb-2 block text-sm font-medium text-gray-700">
              SEO Meta Description
            </label>

            <textarea
              id="meta_description"
              value={metaDescription}
              onChange={(event) =>
                setMetaDescription(event.target.value)
              }
              rows={3}
              placeholder="Safe, reliable and efficient LPG supply, distribution and delivery services."
              className={inputClass}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={showHistoryLink}
              onChange={(event) =>
                setShowHistoryLink(event.target.checked)
              }
              className="h-5 w-5 rounded border-gray-300"
            />

            <span className="text-sm font-medium text-gray-700">
              Show &quot;Our History&quot; link in the website footer
            </span>
          </label>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Site Settings"}
        </button>
      </div>
    </form>
  );
}
