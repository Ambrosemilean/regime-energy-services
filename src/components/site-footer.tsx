import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * Shared corporate footer for every public page.
 *
 * Reads company profile + site settings from Supabase so the company name,
 * description, contact details and social links stay admin-managed. Falls
 * back to approved brand copy when the database is unreachable.
 */

const FOOTER_DESCRIPTION =
  "A trusted downstream LPG company serving homes, businesses and industries with reliable gas supply, distribution, delivery and related energy services. Since 2015, committed to safety, integrity, quality service and customer satisfaction.";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/company-history", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/products", label: "Products" },
  { href: "/branches", label: "Branches" },
  { href: "/#contact", label: "Contact" },
] as const;

const SOCIALS = [
  {
    key: "facebook_url",
    label: "Facebook",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z" />
      </svg>
    ),
  },
  {
    key: "instagram_url",
    label: "Instagram",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069Zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
      </svg>
    ),
  },
  {
    key: "twitter_url",
    label: "X",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
      </svg>
    ),
  },
  {
    key: "linkedin_url",
    label: "LinkedIn",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125ZM7.119 20.452H3.554V9h3.565v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
      </svg>
    ),
  },
  {
    key: "youtube_url",
    label: "YouTube",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
      </svg>
    ),
  },
] as const;

export default async function SiteFooter() {
  let companyName = "Regime Energy Services Limited";
  let logoUrl: string | null = null;
  let phone: string | null = null;
  let email: string | null = null;
  let address: string | null = null;
  let showHistoryLink = true;
  let socials: Partial<Record<string, string>> = {};

  try {
    const supabase = await createClient();

    const [{ data: company }, { data: settings }] = await Promise.all([
      supabase
        .from("company_profile")
        .select("company_name, logo_url, phone, email, address")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("site_settings")
        .select(
          "show_company_history_link, facebook_url, instagram_url, twitter_url, linkedin_url, youtube_url"
        )
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
    ]);

    if (company?.company_name) companyName = company.company_name;
    logoUrl = company?.logo_url ?? null;
    phone = company?.phone ?? null;
    email = company?.email ?? null;
    address = company?.address ?? null;

    if (settings) {
      showHistoryLink = settings.show_company_history_link !== false;
      socials = settings;
    }
  } catch {
    // Fall back to defaults when the database is unreachable.
  }

  return (
    <footer className="border-t border-gray-800 bg-gray-950 px-6 py-14 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              {logoUrl && (
                <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/5">
                  <Image
                    src={logoUrl}
                    alt={`${companyName} logo`}
                    fill
                    sizes="40px"
                    className="object-contain"
                  />
                </span>
              )}

              <p className="text-lg font-bold tracking-tight">
                {companyName}
              </p>
            </div>

            <p className="mt-4 max-w-md text-sm leading-7 text-gray-400">
              {FOOTER_DESCRIPTION}
            </p>

            {showHistoryLink && (
              <Link
                href="/company-history"
                className="mt-4 inline-block text-sm font-semibold text-gray-300 hover:text-white"
              >
                Our History →
              </Link>
            )}
          </div>

          {/* Navigation */}
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400">
              Company
            </p>

            <ul className="mt-4 space-y-2.5 text-sm">
              {NAV_LINKS.map(
                (link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-400 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              )}

              {showHistoryLink && (
                <li>
                  <Link
                    href="/company-history"
                    className="text-gray-400 transition hover:text-white"
                  >
                    Our History
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Contact + socials */}
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400">
              Contact
            </p>

            <ul className="mt-4 space-y-2.5 text-sm text-gray-400">
              {phone && (
                <li>
                  <a
                    href={`tel:${phone}`}
                    className="transition hover:text-white"
                  >
                    {phone}
                  </a>
                </li>
              )}

              {email && (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="break-all transition hover:text-white"
                  >
                    {email}
                  </a>
                </li>
              )}

              {address && <li className="leading-6">{address}</li>}
            </ul>

            {SOCIALS.some((social) => socials[social.key]) && (
              <div className="mt-5 flex flex-wrap gap-2">
                {SOCIALS.map(
                  (social) =>
                    socials[social.key] && (
                      <a
                        key={social.key}
                        href={socials[social.key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${companyName} on ${social.label}`}
                        title={social.label}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-gray-300 transition hover:bg-regime-blue hover:text-white"
                      >
                        {social.icon}
                      </a>
                    )
                )}
              </div>
            )}
          </div>
        </div>

        <p className="mt-12 border-t border-gray-800 pt-6 text-sm text-gray-500">
          © {new Date().getFullYear()} {companyName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
