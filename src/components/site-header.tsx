import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import SiteMobileMenu from "@/components/site-mobile-menu";
import NavIconMenu from "@/components/nav-icon-menu";

type CompanyProfileSummary = {
  company_name: string | null;
  tagline: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  whatsapp: string | null;
  mission: string | null;
  vision: string | null;
  short_description: string | null;
  description: string | null;
};

/**
 * Shared site header for every public page.
 *
 * Two-tier corporate header:
 *  - Utility bar (desktop): phone, email and location from the company
 *    profile, with a slim brand accent stripe on top.
 *  - Main bar: logo + company name on the left, primary navigation in the
 *    centre-right with an animated active underline, and a prominent
 *    "Contact Regime" CTA button on the right.
 *
 * Navigation mirrors the homepage section order; anchors ("#about",
 * "#safety-first", ...) point at homepage sections, so on interior pages
 * they still land on the right place.
 *
 * Cached per-request: the homepage renders SiteHeader, SiteFooter, and the
 * page itself — together they used to fire the same company_profile query
 * three times per render.
 */
export const getActiveCompanyProfile = cache(
  async (): Promise<CompanyProfileSummary | null> => {
    try {
      const supabase = await createClient();

      const { data: company } = await supabase
        .from("company_profile")
        .select(
          "company_name, tagline, logo_url, phone, email, address, whatsapp, mission, vision, short_description, description"
        )
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      return (company as CompanyProfileSummary) ?? null;
    } catch {
      return null;
    }
  }
);

export default async function SiteHeader({
  currentPath = "/",
}: {
  currentPath?: string;
}) {
  let companyName = "Regime Energy Services";
  let logoUrl: string | null = null;
  let phone: string | null = null;
  let email: string | null = null;
  let address: string | null = null;

  try {
    const company = await getActiveCompanyProfile();

    if (company?.company_name) companyName = company.company_name;
    logoUrl = company?.logo_url ?? null;
    phone = company?.phone ?? null;
    email = company?.email ?? null;
    address = company?.address ?? null;
  } catch {
    // Header still renders with defaults when the database is unreachable.
  }

  // Short location label for the utility bar (city / first segment only).
  const locationLabel = address
    ? address.split(",")[0].trim()
    : "Owerri, Imo State";

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Brand accent stripe — thin, always visible */}
      <div
        aria-hidden="true"
        className="h-1 w-full bg-gradient-to-r from-regime-blue via-regime-red to-regime-green"
      />

      {/* Utility bar — desktop only */}
      <div className="hidden border-b border-slate-100 bg-slate-50 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-1.5">
          <div className="flex items-center gap-6 text-xs font-medium text-slate-600">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-1.5 transition hover:text-regime-blue"
              >
                <span aria-hidden="true">📞</span>
                {phone}
              </a>
            )}

            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-1.5 transition hover:text-regime-blue"
              >
                <span aria-hidden="true">✉</span>
                {email}
              </a>
            )}
          </div>

          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span aria-hidden="true">📍</span>
            Serving {locationLabel} &amp; across Imo State
          </p>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:gap-4 sm:px-6 md:py-3">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3"
            aria-label={`${companyName} home`}
          >
            <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-gray-200 transition group-hover:ring-regime-blue/40 sm:h-11 sm:w-11">
              <Image
                src={logoUrl ?? "/logo.svg"}
                alt={`${companyName} logo`}
                fill
                sizes="44px"
                priority
                className="object-contain"
              />
            </span>

            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold tracking-tight text-blue-900 sm:text-lg">
                {companyName}
              </span>
            </span>
          </Link>

          {/* Desktop navigation — icon-only chips, label expands on
              hover or tap (see nav-icon-menu / nav-icon-link) */}
          <NavIconMenu currentPath={currentPath} />

          {/* Desktop CTA */}
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <Link
              href="/#contact"
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-regime-blue px-5 text-sm font-bold text-white shadow-sm transition hover:bg-regime-blue-dark hover:shadow"
            >
              <span aria-hidden="true">💬</span>
              Contact Regime
            </Link>
          </div>

          {/* Mobile menu toggle (md and below) */}
          <div className="flex shrink-0 items-center gap-2">
            <SiteMobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
