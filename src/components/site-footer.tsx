import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveCompanyProfile } from "@/components/site-header";
import { getCompanyWhatsAppLink } from "@/components/whatsapp-actions";
import ContactForm from "@/components/contact-form";

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
  { href: "/company-history", label: "About Us" },
  { href: "/what-we-do", label: "What We Do" },
  { href: "/branches", label: "Our Branches" },
  { href: "/contact", label: "Contact Us" },
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
  let whatsappHref: string | null = null;

  try {
    const [company, settingsResult, whatsappLink, mainBranch] = await Promise.all([
      getActiveCompanyProfile(),
      (async () => {
        const supabase = await createClient();

        const { data } = await supabase
          .from("site_settings")
          .select(
            "show_company_history_link, facebook_url, instagram_url, twitter_url, linkedin_url, youtube_url"
          )
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        return data;
      })(),
      getCompanyWhatsAppLink(
        "Hello Regime Energy Services, I would like to make an enquiry."
      ),
      // Main branch details as a fallback for contact info the company
      // profile may be missing (phone, email, address, WhatsApp).
      (async () => {
        const supabase = await createClient();

        const { data } = await supabase
          .from("branches")
          .select("phone, whatsapp, email, address")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        return data;
      })(),
    ]);

    const settings = settingsResult;
    whatsappHref = whatsappLink;

    if (company?.company_name) companyName = company.company_name;
    logoUrl = company?.logo_url ?? null;

    // Company profile first, main branch as fallback.
    phone = company?.phone || mainBranch?.phone || null;
    email = company?.email || mainBranch?.email || null;
    address = company?.address || mainBranch?.address || null;

    // WhatsApp falls back to the main branch number when the company
    // profile has no dedicated WhatsApp link.
    if (!whatsappHref && mainBranch?.whatsapp) {
      const digits = mainBranch.whatsapp.replace(/\D/g, "");
      if (digits) {
        whatsappHref = `https://wa.me/${digits}?text=${encodeURIComponent(
          "Hello Regime Energy Services, I would like to make an enquiry."
        )}`;
      }
    }

    if (settings) {
      showHistoryLink = settings.show_company_history_link !== false;
      socials = settings;
    }
  } catch {
    // Fall back to defaults when the database is unreachable.
  }

  return (
    <footer
      id="contact"
      className="scroll-mt-20 border-t border-regime-blue-dark bg-regime-blue-dark px-4 py-8 text-white sm:px-6 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-white/5">
                <Image
                  src={logoUrl ?? "/logo.svg"}
                    alt={`${companyName} logo`}
                    fill
                    sizes="36px"
                    className="object-contain"
                  />
              </span>

              <p className="text-base font-bold tracking-tight">
                {companyName}
              </p>
            </div>

            {showHistoryLink && (
              <Link
                href="/company-history"
                className="mt-3 inline-block text-sm font-semibold text-gray-300 hover:text-white"
              >
                Our History →
              </Link>
            )}

            {/* Description stepped down below the Our History link */}
            <p className="mt-3 max-w-md text-sm leading-6 text-blue-100/80">
              {FOOTER_DESCRIPTION}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-100/80">
              Company
            </p>

            <ul className="mt-3 space-y-2 text-sm">
              {NAV_LINKS.map(
                (link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-blue-100/80 transition hover:text-white"
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
                    className="text-blue-100/80 transition hover:text-white"
                  >
                    Our History
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Contact + socials */}
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-100/80">
              Contact
            </p>

            <ul className="mt-3 space-y-2 text-sm text-blue-100/80">
              {phone && (
                <li className="flex items-center gap-2.5">
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
                    className="shrink-0 text-regime-green"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>

                  <a
                    href={`tel:${phone}`}
                    className="transition hover:text-white"
                  >
                    {phone}
                  </a>
                </li>
              )}

              {email && (
                <li className="flex items-center gap-2.5">
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
                    className="shrink-0 text-regime-green"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-10 5L2 7" />
                  </svg>

                  <a
                    href={`mailto:${email}`}
                    className="break-all transition hover:text-white"
                  >
                    {email}
                  </a>
                </li>
              )}

              {whatsappHref && (
                <li className="flex items-center gap-2.5">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="shrink-0 text-regime-green"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.347-.347.52-.52.174-.174.232-.298.347-.497.116-.198.058-.371-.014-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>

                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold transition hover:text-white"
                  >
                    Chat on WhatsApp
                  </a>
                </li>
              )}

              {address && (
                <li className="flex items-start gap-2.5 leading-6">
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
                    className="mt-1 shrink-0 text-regime-green"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>

                  <span>Head office: {address}</span>
                </li>
              )}
            </ul>

            {SOCIALS.some((social) => socials[social.key]) && (
              <div className="mt-4 flex flex-wrap gap-2">
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
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-blue-100 transition hover:bg-regime-blue hover:text-white"
                      >
                        {social.icon}
                      </a>
                    )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contact form â€” submissions are stored in Supabase and emailed
            to the company by the /api/contact server route. */}
                <div className="mt-8 border-t border-white/15 pt-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-blue-100/80">
                Contact Us
              </p>

              <h2 className="regime-heading mt-2 text-xl text-white sm:text-2xl">
                Let&apos;s Help With Your Energy Needs
              </h2>

              <p className="mt-3 max-w-md text-sm leading-6 text-blue-100/80">
                Send us a message and our team will respond as soon as
                possible. For urgent orders, WhatsApp or call us directly.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 sm:p-6">
              <ContactForm />
            </div>
          </div>
        </div>

        <p className="mt-8 border-t border-white/15 pt-4 text-sm text-blue-100/70">
          Â© {new Date().getFullYear()} {companyName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
