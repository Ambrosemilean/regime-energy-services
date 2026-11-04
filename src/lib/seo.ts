import type { Metadata } from "next";

/**
 * Shared SEO helpers for the public website.
 *
 * All canonical URLs point at the production deployment. The helper keeps
 * every page's metadata consistent (canonical + Open Graph + Twitter)
 * without repeating boilerplate in each route.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://regime-energy-services.vercel.app";

export const SITE_NAME = "Regime Energy Services";

export const DEFAULT_TITLE =
  "Regime Energy Services — Reliable LPG Solutions in Owerri";

export const DEFAULT_DESCRIPTION =
  "Safe, reliable and efficient LPG supply, distribution, gas delivery, equipment and repairs in Owerri, Imo State. Regime Gas — serving homes and businesses.";

type SeoInput = {
  title: string;
  description: string;
  /** Path beginning with "/", e.g. "/products". */
  path: string;
  ogImage?: string | null;
};

export function buildMetadata({
  title,
  description,
  path,
  ogImage,
}: SeoInput): Metadata {
  const url = `${SITE_URL}${path === "/" ? "" : path}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_NG",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

/**
 * Organization / LocalBusiness structured data built only from values the
 * company already manages in the admin dashboard. Nothing is invented:
 * fields the company has not filled in are simply omitted.
 */
export function organizationJsonLd(company: {
  company_name?: string | null;
  description?: string | null;
  short_description?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  logo_url?: string | null;
}): object {
  const name = company.company_name || SITE_NAME;

  const sameAs: string[] = [];
  if (company.email) sameAs.push(`mailto:${company.email}`);

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#organization`,
    name,
    alternateName: "Regime Gas",
    url: SITE_URL,
    description:
      company.short_description || company.description || undefined,
    telephone: company.phone || undefined,
    email: company.email || undefined,
    logo: company.logo_url || undefined,
    address: company.address
      ? {
          "@type": "PostalAddress",
          streetAddress: company.address,
          addressLocality: "Owerri",
          addressRegion: "Imo",
          addressCountry: "NG",
        }
      : undefined,
    areaServed: "Owerri, Imo State, Nigeria",
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
}
