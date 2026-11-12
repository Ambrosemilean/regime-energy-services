import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SiteMobileMenu from "@/components/site-mobile-menu";
import TrackedLink from "@/components/analytics/tracked-link";
import { getCompanyWhatsAppLink } from "@/components/whatsapp-actions";

/**
 * Shared site header for every public page.
 *
 * Single server component that reads the active company profile for the
 * logo/name, renders the primary navigation with an active state for the
 * current route, and exposes the "Order Gas" WhatsApp conversion button.
 * Anchors (#about, #services...) only apply on the homepage; on interior
 * pages they point at the homepage section instead.
 */

const NAV_ITEMS = [
  { href: "/#about", label: "About", match: "/" },
  { href: "/services", label: "Services", match: "/services" },
  { href: "/products", label: "Products", match: "/products" },
  { href: "/branches", label: "Branches", match: "/branches" },
  { href: "/company-history", label: "Our History", match: "/company-history" },
  { href: "/#contact", label: "Contact", match: "/#contact" },
] as const;

export default async function SiteHeader({
  currentPath = "/",
}: {
  currentPath?: string;
}) {
  let companyName = "Regime Energy Services";
  let logoUrl: string | null = null;
  let orderHref: string | null = null;

  try {
    const supabase = await createClient();

    const [{ data: company }, whatsappHref] = await Promise.all([
      supabase
        .from("company_profile")
        .select("company_name, logo_url")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
      getCompanyWhatsAppLink(
        "Hello Regime Energy Services, I would like to order gas."
      ),
    ]);

    if (company?.company_name) companyName = company.company_name;
    logoUrl = company?.logo_url ?? null;
    orderHref = whatsappHref;
  } catch {
    // Header still renders with defaults when the database is unreachable.
  }

  // The homepage uses plain section anchors; other pages link back to the
  // homepage section through /#section.
  const isHome = currentPath === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3"
          aria-label={`${companyName} home`}
        >
          {logoUrl && (
            <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white sm:h-11 sm:w-11">
              <Image
                src={logoUrl}
                alt={`${companyName} logo`}
                fill
                sizes="44px"
                priority
                className="object-contain"
              />
            </span>
          )}

          <span className="min-w-0">
            <span className="block truncate text-base font-bold tracking-tight text-blue-900 sm:text-lg">
              {companyName}
            </span>
            <span className="hidden text-xs font-medium uppercase tracking-widest text-gray-500 sm:block">
              Downstream LPG · Since 2013
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 md:flex"
        >
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/#about" || item.href === "/#contact"
                ? false
                : currentPath.startsWith(item.match);

            const className = `nav-link relative rounded text-sm font-medium tracking-wide ${active
                ? "text-blue-800"
                : "text-slate-600 hover:text-blue-800"
              }`;

            return (
              <Link key={item.href} href={item.href} className={className}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {orderHref && (
            <TrackedLink
              href={orderHref}
              event="whatsapp_click"
              label="header_order_gas"
              className="hidden shrink-0 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 md:inline-flex"
            >
              Order Gas
            </TrackedLink>
          )}

          <SiteMobileMenu whatsappHref={orderHref} />
        </div>
      </div>
    </header>
  );
}
