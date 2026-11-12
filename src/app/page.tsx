import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CompanySlideshow from "@/components/company-slideshow";
import BranchWorldMap from "@/components/branch-world-map";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import TrackedLink from "@/components/analytics/tracked-link";
import {
  getCompanyWhatsAppLink,
} from "@/components/whatsapp-actions";

/**
 * Homepage — redesigned corporate layout for Regime Energy Services.
 *
 * All company content remains dynamic from Supabase (company profile,
 * media, services, products, branches, site settings). Only presentation
 * is defined here; the approved brand copy below is static page content.
 */

type ServiceRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  image_url: string | null;
  service_category: string | null;
  display_order: number | null;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  display_order: number | null;
  product_images: {
    image_url: string;
    alt_text: string | null;
    is_primary: boolean | null;
    display_order: number | null;
  }[];
};

type BranchRow = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  description: string | null;
  display_order: number | null;
};

/** Presentation-only service commitments (approved homepage copy). */
const TRUST_COMMITMENTS = [
  {
    title: "Accurate Dispensing",
    text: "Every refill is measured with calibrated equipment — 1kg is always 1kg.",
  },
  {
    title: "Safe Handling",
    text: "Trained staff, certified cylinders and disciplined LPG handling, storage and transport.",
  },
  {
    title: "Home and Business Delivery",
    text: "Swift delivery to homes and businesses across Egbu, Owerri Municipal and Owerri North.",
  },
] as const;

const CUSTOMER_CATEGORIES = [
  { label: "Residential", text: "Household refills and cylinder accessories." },
  { label: "Commercial", text: "Restaurants, hotels, bakeries and schools." },
  { label: "Industrial", text: "Bulk supply for factories and industry." },
] as const;

/**
 * Mission / vision cards. Admin-written copy is preferred when present.
 */

export default async function Home() {
  const supabase = await createClient();

  const [
    { data: company },
    { data: media },
    { data: services },
    { data: products },
    { data: branches },
    { data: settings },
    orderHref,
    deliveryHref,
  ] = await Promise.all([
    supabase
      .from("company_profile")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("company_media")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("services")
      .select(
        "id, name, slug, short_description, description, image_url, service_category, is_active, display_order"
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("products")
      .select(
        `id, name, slug, short_description, description, is_active, display_order,
        product_images (image_url, alt_text, is_primary, display_order)`
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("branches")
      .select(
        `id, name, slug, address, phone, whatsapp, email, google_maps_url,
        latitude, longitude, image_url, description, is_active, display_order`
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("site_settings")
      .select("show_branch_map")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle(),
    getCompanyWhatsAppLink(
      "Hello Regime Energy Services, I would like to order gas."
    ),
    getCompanyWhatsAppLink(
      "Hello Regime Energy Services, I would like to request a gas delivery.\n\nMy location:\nCylinder size:"
    ),
  ]);

  const serviceList = (services ?? []) as ServiceRow[];
  const productList = (products ?? []) as ProductRow[];
  const branchList = (branches ?? []) as BranchRow[];

  // The interactive branch map can be switched off from the admin
  // dashboard (Site Settings → "Show the branch map on the homepage").
  const showBranchMap = settings?.show_branch_map !== false;

  // The admin uploads a weighbridge photo via Company Media with a file
  // name/title containing "weighbridge". It is shown in the featured
  // weighbridge section instead of the hero slideshow.
  const weighbridgeMedia =
    media?.find((item) =>
      [item.title, item.alt_text]
        .filter(Boolean)
        .some((value) =>
          (value as string).toLowerCase().includes("weighbridge")
        )
    ) ?? null;

  const heroMedia = weighbridgeMedia
    ? media!.filter((item) => item.id !== weighbridgeMedia.id)
    : (media ?? []);

  const phoneHref = company?.phone ? `tel:${company.phone}` : null;
  const callHref = phoneHref ?? (company?.phone ? `tel:${company.phone}` : null);
  const phoneDisplay = company?.phone || "08021295401";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader currentPath="/" />

      <main className="flex-1">
        {/* ---------------------------------------------------------- */}
        {/* Hero — real company imagery with headline overlay          */}
        {/* ---------------------------------------------------------- */}
        {heroMedia.length > 0 ? (
          <CompanySlideshow media={heroMedia}>
            <div className="max-w-3xl py-16 md:py-24">
              <span className="regime-accent-chip bg-white/95">
                Since 2013 · Owerri, Imo State
              </span>

              <h1 className="mt-5 text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
                Powering Everyday Life With Dependable LPG
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
                Regime Energy Services is a downstream energy company
                supplying LPG to homes, businesses and industries, with safe
                handling and accurate dispensing every time.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#about"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-regime-blue px-7 py-3 font-bold text-white transition hover:bg-regime-blue-dark"
                >
                  Discover More
                </Link>

                {deliveryHref && (
                  <TrackedLink
                    href={deliveryHref}
                    event="whatsapp_click"
                    label="hero_request_delivery"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-regime-red px-7 py-3 font-bold text-white transition hover:bg-red-700"
                  >
                    Request Delivery
                  </TrackedLink>
                )}
              </div>
            </div>
          </CompanySlideshow>
        ) : (
          <section className="bg-regime-blue-dark px-4 py-20 text-white sm:px-6 md:py-28">
            <div className="mx-auto max-w-7xl">
              <span className="regime-accent-chip bg-white/95">
                Since 2013 · Owerri, Imo State
              </span>

              <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
                Powering Everyday Life With Dependable LPG
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">
                Regime Energy Services is a downstream energy company
                supplying LPG to homes, businesses and industries, with safe
                handling and accurate dispensing every time.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#about"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-white px-7 py-3 font-bold text-regime-blue-dark transition hover:bg-blue-50"
                >
                  Discover More
                </Link>

                {deliveryHref && (
                  <TrackedLink
                    href={deliveryHref}
                    event="whatsapp_click"
                    label="hero_request_delivery"
                    className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-regime-red px-7 py-3 font-bold text-white transition hover:bg-red-700"
                  >
                    Request Delivery
                  </TrackedLink>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ---------------------------------------------------------- */}
        {/* Trust indicators — marquee ticker + customer categories */}
        <section className="border-b border-gray-100 bg-white px-0 py-10 sm:py-12">
          {/* Marquee ticker of service commitments (duplicated for a seamless
              loop; hidden from screen readers as a duplicate) */}
          <div className="regime-marquee" aria-label="Our service commitments">
            <div className="regime-marquee-track">
              {[0, 1].map((copy) => (
                <div
                  key={copy}
                  aria-hidden={copy === 1}
                  className="flex shrink-0 items-center gap-10 pr-10"
                >
                  {TRUST_COMMITMENTS.map((item) => (
                    <span
                      key={item.title}
                      className="flex items-center gap-2.5 whitespace-nowrap text-sm font-semibold text-gray-800"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-regime-green/15 text-xs font-bold text-regime-green-dark"
                      >
                        ✓
                      </span>

                      <span className="font-bold text-gray-900">
                        {item.title}
                      </span>

                      <span className="hidden text-gray-500 md:inline">
                        — {item.text}
                      </span>

                      <span
                        aria-hidden="true"
                        className="ml-6 h-1.5 w-1.5 rounded-full bg-regime-red"
                      />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

            <div className="mx-auto max-w-7xl">
              <div className="border-t border-gray-100 pt-10">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <h2 className="max-w-md text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Trusted by homes, businesses and industries across Owerri.
                </h2>

                <div className="grid gap-4 sm:grid-cols-3">
                  {CUSTOMER_CATEGORIES.map((category) => (
                    <div
                      key={category.label}
                      className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4"
                    >
                      <p className="text-sm font-bold text-regime-blue">
                        {category.label}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-gray-600">
                        {category.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Location + statistics                                       */}
        {/* ---------------------------------------------------------- */}
        <section className="px-4 py-12 sm:px-6 md:py-14">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="regime-eyebrow">Where We Operate</p>

                <h2 className="regime-heading text-3xl sm:text-4xl">
                  We Serve Owerri And Beyond
                </h2>

                <p className="regime-lead mt-4 max-w-xl [text-align:justify]">
                <strong>Two branches</strong> keep LPG close to you: our Main
                Branch at <strong>Egbeada Junction, Irete</strong>, and our
                Egbu Branch on Egbu Road, with delivery across Egbu, Owerri
                Municipal and Owerri North.
              </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/branches"
                    className="regime-button-primary"
                  >
                    Find a Branch
                  </Link>

                  {orderHref && (
                    <TrackedLink
                      href={orderHref}
                      event="whatsapp_click"
                      label="locations_order_gas"
                      className="regime-button-secondary"
                    >
                      Order Gas
                    </TrackedLink>
                  )}
                </div>
              </div>

              {/* Statistics — branch count is live; the rest is approved
                  company copy (no stats table exists in the database). */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="regime-card p-6">
                  <p className="regime-stat-number">13+</p>

                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    Years of Experience
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Serving since 2013
                  </p>
                </div>

                <div className="regime-card p-6">
                  <p className="regime-stat-number">{branchList.length || 2}</p>

                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    Branches in Owerri
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Egbeada Junction &amp; Egbu Road
                  </p>
                </div>

                <div className="regime-card p-6">
                  <p className="regime-stat-number">4</p>

                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    Refill Sizes
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    3kg, 6kg, 12.5kg and 50kg
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* About                                                       */}
        {/* ---------------------------------------------------------- */}
        <section id="about" className="bg-gray-50 px-4 py-12 sm:px-6 md:py-14">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="regime-image overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                {media && media.length > 0 ? (
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={
                        weighbridgeMedia?.image_url ??
                        media[0].image_url
                      }
                      alt={
                        media[0].alt_text ||
                        media[0].title ||
                        "Regime Energy Services operations"
                      }
                      fill
                      quality={85}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] w-full items-center justify-center bg-regime-blue/5">
                    <p className="text-lg font-bold text-regime-blue">
                      Regime Energy Services
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="regime-eyebrow">About Regime</p>

                <h2 className="regime-heading text-3xl sm:text-4xl">
                  Providing Affordable and Reliable Energy
                </h2>

                <p className="regime-lead mt-4 [text-align:justify]">
                  <strong>Since 2013</strong>, Regime Energy Services Limited
                  has made LPG more accessible through dependable distribution
                  and supply — serving households, commercial establishments
                  and industry with <strong>reliability, transparency,
                  professionalism and safety</strong>.
                </p>

                <ul className="mt-7 space-y-4">
                  {[
                    "Accurately measured LPG refills",
                    "Safe handling, storage and transport",
                    "Easy ordering and delivery on WhatsApp",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-regime-green/15 text-[11px] font-bold text-regime-green-dark"
                      >
                        ✓
                      </span>

                      <span className="text-sm font-medium text-gray-800">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-9">
                  <Link
                    href="/company-history"
                    className="regime-button-primary"
                  >
                    Read More
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Safety / Mission / Vision                                   */}
        {/* ---------------------------------------------------------- */}
        <section className="px-4 py-12 sm:px-6 md:py-14">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="regime-eyebrow">Safety First</p>

              <h2 className="regime-heading text-2xl sm:text-3xl">
                Safe, Dependable Energy for Every Home and Business
              </h2>

              <p className="regime-lead mt-4 text-justify">
                Responsible LPG handling, storage, transport and accurate
                dispensing — every kilogram we sell is measured honestly.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                {
                  title: "Our Mission",
                  text:
                    company?.mission ||
                    "To deliver safe, reliable and accessible LPG solutions to homes, businesses and industries.",
                  accent: "border-l-regime-blue bg-regime-blue",
                  letter: "M",
                },
                {
                  title: "Our Vision",
                  text:
                    company?.vision ||
                    "To be a trusted name in Nigeria's downstream LPG industry.",
                  accent: "border-l-regime-red bg-regime-red",
                  letter: "V",
                },
              ].map((card) => (
                <div key={card.title} className="regime-mvp-card">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white ${card.accent}`}
                  >
                    {card.letter}
                  </span>

                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold tracking-tight text-gray-900">
                      {card.title}
                    </h3>

                    <p className="mt-1.5 text-sm font-semibold leading-7 text-gray-700 text-justify">
                      {card.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Services                                                    */}
        {/* ---------------------------------------------------------- */}
        <section
          id="services"
          className="bg-gray-50 px-4 py-16 sm:px-6 md:py-20"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="regime-eyebrow">What We Do</p>

              <h2 className="regime-heading text-3xl sm:text-4xl">
                Energy and Support Services
              </h2>

              <p className="regime-lead mt-4">
                From a single household refill to bulk supply for industry —
                everything you need to cook, trade and operate on LPG.
              </p>
            </div>

            {serviceList.length > 0 ? (
              <>
                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {serviceList.map((service) => (
                    <Link
                      key={service.id}
                      href={`/services/${service.slug}`}
                      className="regime-card group flex flex-col overflow-hidden"
                    >
                      {service.image_url ? (
                        <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                          <Image
                            src={service.image_url}
                            alt={service.name}
                            fill
                            quality={85}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="flex h-48 w-full items-center justify-center bg-regime-blue/5">
                          <span className="text-sm font-bold uppercase tracking-widest text-regime-blue">
                            {service.service_category || "Service"}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-1 flex-col p-6">
                        <h3 className="font-bold text-gray-900 group-hover:text-regime-blue">
                          {service.name}
                        </h3>

                        <p className="mt-3 flex-1 text-sm leading-6 text-gray-600">
                          {service.short_description ||
                            service.description ||
                            "Professional and dependable service from Regime Energy Services."}
                        </p>

                        <span className="mt-5 inline-block text-sm font-bold text-regime-blue group-hover:underline">
                          Learn More →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="mt-10 text-center">
                  <Link href="/services" className="regime-button-secondary">
                    View All Services
                  </Link>
                </div>
              </>
            ) : (
              <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <p className="text-gray-600">
                  Our services will be displayed here.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Featured weighbridge                                        */}
        {/* ---------------------------------------------------------- */}
        <section className="bg-regime-blue-dark px-4 py-12 text-white sm:px-6 md:py-14">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-10 md:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-regime-green">
                  Featured Service
                </p>

                <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                  Weighbridge Services
                </h2>

                <p className="mt-5 max-w-xl text-base leading-8 text-blue-100">
                  Accurate weighing for vehicles and loads, backed by the
                  same commitment to measurement that goes into every
                  cylinder we fill.
                </p>

                <a
                  href="#contact"
                  className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-regime-red px-7 py-3 font-bold text-white transition hover:bg-red-700"
                >
                  Enquire About Weighbridge
                </a>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/15">
                {weighbridgeMedia ? (
                  <div className="relative aspect-[16/10] w-full">
                    <Image
                      src={weighbridgeMedia.image_url}
                      alt={
                        weighbridgeMedia.alt_text ||
                        weighbridgeMedia.title ||
                        "Regime weighbridge operations"
                      }
                      fill
                      quality={85}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/10] w-full items-center justify-center bg-white/10 p-8 text-center">
                    <div>
                      <p className="text-5xl font-bold tracking-tight text-regime-green">
                        1kg = 1kg
                      </p>

                      <p className="mt-4 text-blue-100">
                        Accurate dispensing and dependable measurement are
                        part of every service commitment we make.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Products                                                    */}
        {/* ---------------------------------------------------------- */}
        <section id="products" className="px-4 py-12 sm:px-6 md:py-14">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <p className="regime-eyebrow justify-center">Products</p>

              <h2 className="regime-heading text-3xl sm:text-4xl">
                LPG Products and Accessories
              </h2>

              <p className="regime-lead mx-auto mt-5 max-w-2xl">
                Cylinders, regulators, valves, burners, cookers, hoses and
                fittings — quality LPG equipment from our branches in
                Owerri.
              </p>
            </div>

            {productList.length > 0 ? (
              <>
                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {productList.slice(0, 8).map((product) => {
                    const productImages = Array.isArray(product.product_images)
                      ? [...product.product_images].sort(
                        (a, b) =>
                          (a.display_order ?? 0) - (b.display_order ?? 0)
                      )
                      : [];

                    const primaryProductImage =
                      productImages.find((image) => image.is_primary === true) ??
                      productImages[0];

                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="regime-card group flex flex-col overflow-hidden"
                      >
                        {primaryProductImage ? (
                          <div className="relative h-52 w-full overflow-hidden bg-gray-100">
                            <Image
                              src={primaryProductImage.image_url}
                              alt={
                                primaryProductImage.alt_text || product.name
                              }
                              fill
                              quality={85}
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              className="object-cover transition duration-300 group-hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="flex h-52 w-full items-center justify-center bg-regime-blue/5">
                            <span className="text-sm font-bold uppercase tracking-widest text-regime-blue">
                              LPG
                            </span>
                          </div>
                        )}

                        <div className="flex flex-1 flex-col p-6">
                          <h3 className="font-bold text-gray-900 group-hover:text-regime-blue">
                            {product.name}
                          </h3>

                          <p className="mt-3 flex-1 text-sm leading-6 text-gray-600">
                            {product.short_description ||
                              product.description ||
                              "Quality LPG product available from Regime Energy Services."}
                          </p>

                          <span className="mt-5 inline-block text-sm font-bold text-regime-blue group-hover:underline">
                            View Product →
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-10 text-center">
                  <Link href="/products" className="regime-button-primary">
                    View All Products
                  </Link>
                </div>
              </>
            ) : (
              <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
                <p className="text-gray-600">
                  Our LPG products and accessories will be displayed here.
                </p>

                <Link
                  href="/products"
                  className="mt-5 inline-block font-semibold text-regime-blue hover:underline"
                >
                  Explore Products →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Branches                                                    */}
        {/* ---------------------------------------------------------- */}
        <section id="branches" className="bg-gray-50 py-12 md:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <p className="regime-eyebrow justify-center">Our Locations</p>

              <h2 className="regime-heading text-3xl sm:text-4xl">
                Find a Regime Branch Near You
              </h2>

              <p className="regime-lead mx-auto mt-5 max-w-2xl">
                Visit a branch for LPG products, refills, enquiries and
                customer support.
              </p>
            </div>

            {branchList.length > 0 ? (
              showBranchMap ? (
                <div className="mt-8 text-center">
                  <Link
                    href="/branches"
                    className="regime-button-secondary"
                  >
                    View All Branches
                  </Link>
                </div>
              ) : (
                <div className="mt-8 text-center">
                  <Link href="/branches" className="regime-button-primary">
                    View All Branches
                  </Link>
                </div>
              )
            ) : (
              <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <p className="text-gray-600">
                  Our branch locations will be displayed here.
                </p>
              </div>
            )}
          </div>

          {/* Interactive world map — clicking a branch pin reveals that
              branch's full details below. It renders outside the content
              column so it stretches edge-to-edge across the full page
              width. Can be hidden from Site Settings in the admin
              dashboard. */}
          {branchList.length > 0 && showBranchMap && (
            <div className="mt-10">
              <BranchWorldMap branches={branchList} />
            </div>
          )}
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Contact + WhatsApp enquiry                                  */}
        {/* ---------------------------------------------------------- */}
        <section id="contact" className="px-4 py-12 sm:px-6 md:py-14">
          <div className="mx-auto max-w-7xl">
            <div className="regime-card p-8 md:p-12">
              <div className="grid gap-10 md:grid-cols-2">
                <div>
                  <p className="regime-eyebrow">Contact Regime</p>

                  <h2 className="regime-heading text-3xl">
                    Let&apos;s Help With Your Energy Needs
                  </h2>

                  <p className="regime-lead mt-5">
                    Reach out for LPG supply, delivery, services and
                    enquiries. We reply fastest on WhatsApp.
                  </p>

                  <dl className="mt-8 space-y-5">
                    {company?.phone && (
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-widest text-gray-500">
                          Phone
                        </dt>

                        <dd>
                          <a
                            href={`tel:${company.phone}`}
                            className="mt-1 block font-semibold text-regime-blue hover:underline"
                          >
                            {company.phone}
                          </a>
                        </dd>
                      </div>
                    )}

                    {company?.email && (
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-widest text-gray-500">
                          Email
                        </dt>

                        <dd>
                          <a
                            href={`mailto:${company.email}`}
                            className="mt-1 block break-all font-semibold text-regime-blue hover:underline"
                          >
                            {company.email}
                          </a>
                        </dd>
                      </div>
                    )}

                    {company?.address && (
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-widest text-gray-500">
                          Address
                        </dt>

                        <dd className="mt-1 font-semibold leading-6 text-gray-900">
                          {company.address}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* WhatsApp enquiry panel */}
                <div className="rounded-2xl bg-regime-blue-dark p-8 text-white md:p-10">
                  <h3 className="text-2xl font-bold">Need gas today?</h3>

                  <p className="mt-4 leading-7 text-blue-100">
                    Tell us your location and cylinder size on WhatsApp and
                    we will arrange your refill or delivery.
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    {orderHref && (
                      <TrackedLink
                        href={orderHref}
                        event="whatsapp_click"
                        label="contact_whatsapp_enquiry"
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700"
                      >
                        Chat on WhatsApp
                      </TrackedLink>
                    )}

                    {callHref && (
                      <TrackedLink
                        href={callHref}
                        event="phone_click"
                        label="contact_call"
                        target=""
                        className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-white px-6 py-3 font-bold text-regime-blue-dark transition hover:bg-blue-50"
                      >
                        Call {phoneDisplay}
                      </TrackedLink>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
