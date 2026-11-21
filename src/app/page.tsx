import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CompanySlideshow from "@/components/company-slideshow";
import BranchWorldMap from "@/components/branch-world-map";
import SiteHeader, {
  getActiveCompanyProfile,
} from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import TrackedLink from "@/components/analytics/tracked-link";
import {
  getCompanyWhatsAppLink,
} from "@/components/whatsapp-actions";

/**
 * Homepage — corporate layout for Regime Energy Services.
 *
 * Section order (fixed): Hero → About → Safety First → What We Do →
 * Featured Services → Where We Operate → Why Choose Us → Our Operations →
 * Contact → Footer.
 *
 * All company content remains dynamic from Supabase (company profile,
 * media, services, products, branches, site settings). Only presentation
 * is defined here; the approved brand copy below is static page content.
 */

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

type MediaRow = {
  id: string;
  title: string | null;
  alt_text: string | null;
  image_url: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
};

export default async function Home() {
  const supabase = await createClient();

  // Cached per-request company profile (shared with SiteHeader/SiteFooter
  // and the WhatsApp link builders) — one DB round-trip instead of four.
  const cachedCompany = await getActiveCompanyProfile();

  const [{ data: media }, { data: branches }, { data: settings }, orderHref] = await Promise.all([
    supabase
      .from("company_media")
      .select(
        "id, title, alt_text, image_url, description, display_order, is_active"
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
  ]);

  const branchList = ((branches ?? []) as BranchRow[]).filter(
    (branch, index, all) =>
      all.findIndex((other) => other.slug === branch.slug) === index
  );

  // The interactive branch map can be switched off from the admin
  // dashboard (Site Settings → "Show the branch map on the homepage").
  const showBranchMap = settings?.show_branch_map !== false;

  const mediaList = (media ?? []) as MediaRow[];

  // Admin uploads a weighbridge photo via company Media (title/alt text
  // contains "weighbridge"); it is reserved for the Featured Services band
  // instead of the hero slideshow.
  const weighbridgeMedia =
    mediaList.find((item) =>
      [item.title, item.alt_text]
        .filter(Boolean)
        .some((value) => (value as string).toLowerCase().includes("weighbridge"))
    ) ?? null;

  const heroMedia = weighbridgeMedia
    ? mediaList.filter((item) => item.id !== weighbridgeMedia.id)
    : mediaList;

  // Operations gallery strip (company media minus the weighbridge shot).
  const galleryItems = heroMedia.slice(0, 6);

  const phoneHref = cachedCompany?.phone ? `tel:${cachedCompany.phone}` : null;
  const phoneDisplay = cachedCompany?.phone || "08021295401";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader currentPath="/" />

      <main className="flex-1">
        {/* ---------------------------------------------------------- */}
        {/* 1. HERO — real company imagery with headline overlay      */}
        {/* ---------------------------------------------------------- */}
        {heroMedia.length > 0 ? (
          <CompanySlideshow media={heroMedia}>
            <div className="max-w-3xl pb-16 pt-14 md:py-20">
              <span className="regime-accent-chip bg-white/95">
                Since 2013 · Owerri, Imo State
              </span>

              <h1 className="mt-5 text-3xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
                Reliable Energy. Safe Operations. Dependable Service.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
                From LPG supply and distribution to gas delivery, equipment
                support, logistics and industrial weighing services, Regime
                Energy Services delivers dependable energy solutions across
                Imo State.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/#what-we-do"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-regime-blue px-7 py-3 font-bold text-white transition hover:bg-regime-blue-dark"
                >
                  Explore What We Do
                </Link>

                <Link
                  href="/#where-we-operate"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/40 bg-white/10 px-7 py-3 font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Find a Branch
                </Link>
              </div>
            </div>
          </CompanySlideshow>
        ) : (
          <section className="bg-regime-blue-dark px-4 py-20 text-white sm:px-6 md:py-28">
            <div className="mx-auto max-w-7xl">
              <span className="regime-accent-chip bg-white/95">
                Since 2013 · Owerri, Imo State
              </span>

              <h1 className="mt-5 max-w-4xl text-3xl font-bold leading-tight sm:text-5xl md:text-6xl">
                Reliable Energy. Safe Operations. Dependable Service.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-blue-100 sm:text-lg">
                From LPG supply and distribution to gas delivery, equipment
                support, logistics and industrial weighing services, Regime
                Energy Services delivers dependable energy solutions across
                Imo State.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/#what-we-do"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-white px-7 py-3 font-bold text-regime-blue-dark transition hover:bg-blue-50"
                >
                  Explore What We Do
                </Link>

                <Link
                  href="/#where-we-operate"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/40 bg-white/10 px-7 py-3 font-bold text-white transition hover:bg-white/20"
                >
                  Find a Branch
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ---------------------------------------------------------- */}
        {/* 2. ABOUT REGIME — immediately after the hero               */}
        {/* ---------------------------------------------------------- */}
        <section id="about" className="bg-gray-50 px-4 py-12 sm:px-6 md:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="regime-image overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                {mediaList.length > 0 ? (
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={
                        weighbridgeMedia?.image_url ?? mediaList[0].image_url
                      }
                      alt={
                        mediaList[0].alt_text ||
                        mediaList[0].title ||
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
                  An Established Downstream LPG Business
                </h2>

                <p className="regime-lead mt-4">
                  Regime Energy Services Limited has been active in the gas
                  downstream industry <strong>since 2013</strong>, making LPG
                  more accessible through dependable distribution and supply —
                  serving households, commercial establishments and industry
                  with <strong>reliability, transparency, professionalism and
                  safety</strong>.
                </p>

                <ul className="mt-7 space-y-4">
                  {[
                    "Accurately measured LPG refills",
                    "Safe handling, storage and transport",
                    "Home and hotel delivery across Imo State",
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
        {/* 3. SAFETY FIRST — immediately after About Regime           */}
        {/* ---------------------------------------------------------- */}
        <section
          id="safety-first"
          className="scroll-mt-24 px-4 py-12 sm:px-6 md:py-16"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="regime-eyebrow">Safety First</p>

              <h2 className="regime-heading text-2xl sm:text-3xl">
                Safe, Dependable Energy for Every Home and Business
              </h2>

              <p className="regime-lead mt-4">
                Gas safety starts with awareness. We educate every customer on
                responsible LPG handling, storage, transportation, installation
                and usage — because safe gas is dependable gas. Our team and
                safety assistant are always available to answer your questions.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                {
                  title: "Safe Gas Handling",
                  text:
                    "Trained personnel follow strict procedures when filling, decanting and dispensing LPG, so every cylinder leaves our plants safely.",
                },
                {
                  title: "Proper Storage",
                  text:
                    "Cylinders should be stored upright, in a well-ventilated space, away from heat and direct sunlight. Our team can advise you on the safest setup.",
                },
                {
                  title: "Careful Transportation",
                  text:
                    "Our delivery crews secure cylinders properly and handle every unit with care from branch to doorstep.",
                },
                {
                  title: "Correct Installation & Usage",
                  text:
                    "Regulators, hoses and clips should be fitted correctly and checked regularly. Ask us — we guide you before and after every installation.",
                },
              ].map((card) => (
                <div key={card.title} className="regime-mvp-card">
                  <span
                    aria-hidden="true"
                    className="regime-icon-chip regime-icon-red mt-0.5 h-10 w-10 text-sm"
                  >
                    🛡
                  </span>

                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold tracking-tight text-regime-blue-dark">
                      {card.title}
                    </h3>

                    <p className="mt-1.5 text-sm font-semibold leading-7 text-gray-700">
                      {card.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>


          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 4. WHAT WE DO — four unified category cards                */}
        {/* ---------------------------------------------------------- */}
        <section
          id="what-we-do"
          className="scroll-mt-24 bg-gray-50 px-4 py-16 sm:px-6 md:py-20"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="regime-eyebrow justify-center">What We Do</p>

              <h2 className="regime-heading text-3xl sm:text-4xl">
                Powering Lives. Delivering Energy. Driving Progress.
              </h2>

              <p className="regime-lead mt-4">
                Everything Regime Energy Services offers, in one place. Choose
                a category below to explore our products, services, maintenance
                and repairs, or consultation options.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Products",
                  icon: "🛒",
                  chip: "regime-icon-blue",
                  surface: "regime-card-blue",
                  text:
                    "Cylinders, regulators, valves, burners, cookers, hoses and quality LPG fittings from our branches in Owerri.",
                  href: "/products",
                  cta: "Learn More",
                },
                {
                  title: "Services",
                  icon: "🚚",
                  chip: "regime-icon-gold",
                  surface: "regime-card-gold",
                  text:
                    "LPG supply, bulk distribution, home and hotel delivery, haulage and dependable customer support across Imo State.",
                  href: "/services",
                  cta: "Learn More",
                },
                {
                  title: "Maintenance & Repairs",
                  icon: "🔧",
                  chip: "regime-icon-red",
                  surface: "regime-card-red",
                  text:
                    "Gas cooker repairs, burner repairs and equipment servicing that keep your LPG installations safe and working.",
                  href: "/services",
                  cta: "Learn More",
                },
                {
                  title: "Consultations",
                  icon: "💬",
                  chip: "regime-icon-navy",
                  surface: "regime-card-navy",
                  text:
                    "Expert guidance on LPG installations, safety, cylinder sizing and energy planning for homes and businesses.",
                  href: "/#contact",
                  cta: "Learn More",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className={`${card.surface} flex flex-col p-7 text-center`}
                >
                  <span
                    aria-hidden="true"
                    className={`regime-icon-chip mx-auto h-14 w-14 text-2xl ${card.chip}`}
                  >
                    {card.icon}
                  </span>

                  <h3 className="mt-5 text-lg font-extrabold tracking-tight text-regime-blue-dark">
                    {card.title}
                  </h3>

                  <p className="mt-3 flex-1 text-sm leading-6 text-gray-600">
                    {card.text}
                  </p>

                  <Link
                    href={card.href}
                    className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-regime-blue px-6 py-2.5 text-sm font-bold text-white transition hover:bg-regime-blue-dark"
                  >
                    {card.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 5. FEATURED SERVICES — Weighbridge Services ONLY            */}
        {/* ---------------------------------------------------------- */}
        <section
          id="featured-services"
          className="scroll-mt-24 px-4 py-12 sm:px-6 md:py-16"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="regime-eyebrow">Featured Service</p>

              <h2 className="regime-heading text-3xl sm:text-4xl">
                Weighbridge Services
              </h2>

              <p className="regime-lead mt-4">
                Accurate weighing for vehicles and loads, backed by the same
                commitment to measurement that goes into every cylinder we
                fill.
              </p>
            </div>

            <div className="mt-10 overflow-hidden rounded-2xl bg-regime-blue-dark text-white">
              <div className="grid items-center gap-10 p-8 md:grid-cols-2 md:p-12">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-regime-green">
                    Precise · Certified · Dependable
                  </p>

                  <h3 className="mt-3 text-2xl font-bold md:text-3xl">
                    Industrial Weighbridge Operations
                  </h3>

                  <p className="mt-4 max-w-xl text-base leading-8 text-blue-100">
                    Our weighbridge provides dependable weight verification
                    for trucks, tankers and bulk loads — trusted by haulage
                    operators and businesses across the region, and run to
                    the same honest-measurement standard we apply to every
                    kilogram of LPG we sell.
                  </p>

                  <ul className="mt-6 space-y-3">
                    {[
                      "Accurate vehicle and load weighing",
                      "Dependable, honest measurement",
                      "Open to hauliers, businesses and individuals",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold text-regime-green"
                        >
                          ✓
                        </span>

                        <span className="text-sm font-medium text-blue-50">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/#contact"
                      className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-regime-red px-7 py-3 font-bold text-white transition hover:bg-red-700"
                    >
                      Contact Us About Weighbridge
                    </Link>
                  </div>
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
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 6. WHERE WE OPERATE — branches + Imo State coverage        */}
        {/* ---------------------------------------------------------- */}
        <section
          id="where-we-operate"
          className="scroll-mt-24 bg-gray-50 py-12 md:py-16"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <p className="regime-eyebrow justify-center">Where We Operate</p>

              <h2 className="regime-heading text-3xl sm:text-4xl">
                Our Locations Across Imo State
              </h2>

              <p className="regime-lead mx-auto mt-5 max-w-2xl">
                Regime Energy Services delivers services across Imo State —
                our branches are physical points of presence, but our supply,
                delivery and support reach customers throughout the state.
              </p>
            </div>

            {/* Branch names, addresses and contact details live on the
                dedicated branches page — opened via "View All Branches".
                The interactive map below is the only branch preview here. */}
            <div className="mt-10 text-center">
              <Link href="/branches" className="regime-button-primary">
                View All Branches
              </Link>
            </div>
          </div>

          {/* Interactive world map — clicking a branch pin reveals that
              branch's full details below. Renders edge-to-edge. Can be
              hidden from Site Settings in the admin dashboard. */}
          {branchList.length > 0 && showBranchMap && (
            <div className="mt-10">
              <BranchWorldMap branches={branchList} />
            </div>
          )}
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 7. WHY CHOOSE US                                           */}
        {/* ---------------------------------------------------------- */}
        <section
          id="why-choose-us"
          className="scroll-mt-24 px-4 py-12 sm:px-6 md:py-16"
        >
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <p className="regime-eyebrow justify-center">Why Choose Us</p>

              <h2 className="regime-heading text-3xl sm:text-4xl">
                The Regime Difference
              </h2>

              <p className="regime-lead mx-auto mt-5 max-w-2xl">
                Every cylinder, every delivery and every service call is
                backed by experience, honest measurement and a safety culture
                that never cuts corners.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Industry Experience",
                  text:
                    "Operating in the downstream LPG industry since 2013, with the know-how that comes from years of daily plant, delivery and customer work.",
                  icon: "🏅",
                  chip: "regime-icon-navy",
                  surface: "regime-card-navy",
                },
                {
                  title: "Reliable Products & Services",
                  text:
                    "Quality LPG products and dependable services, backed by honest measurement — you pay for exactly what your cylinder receives.",
                  icon: "⚖",
                  chip: "regime-icon-green",
                  surface: "regime-card-sky",
                },
                {
                  title: "Commitment to Safety",
                  text:
                    "Trained personnel, proper storage, careful transport and customer safety education at every step of the LPG journey.",
                  icon: "🛡",
                  chip: "regime-icon-navy",
                  surface: "regime-card-navy",
                },
                {
                  title: "Customer Support",
                  text:
                    "A responsive customer team reachable by phone, WhatsApp and our online safety assistant whenever you need help.",
                  icon: "💬",
                  chip: "regime-icon-red",
                  surface: "regime-card-red",
                },
                {
                  title: "Home & Hotel Delivery",
                  text:
                    "Doorstep delivery solutions for households, hotels and businesses — scheduled, secure and handled with care.",
                  icon: "🚚",
                  chip: "regime-icon-gold",
                  surface: "regime-card-gold",
                },
                {
                  title: "Professional Operations",
                  text:
                    "Own plants, haulage and weighing infrastructure operated to consistent professional standards.",
                  icon: "🏭",
                  chip: "regime-icon-blue",
                  surface: "regime-card-sky",
                },
                {
                  title: "Customer Satisfaction",
                  text:
                    "We stand behind every refill, delivery and service call — our reputation is built on customers who come back.",
                  icon: "🤝",
                  chip: "regime-icon-teal",
                  surface: "regime-card-grey",
                },
                {
                  title: "Coverage Across Imo State",
                  text:
                    "Branches in Owerri and service delivery reaching customers across Imo State, wherever you are.",
                  icon: "📍",
                  chip: "regime-icon-blue",
                  surface: "regime-card-sky",
                },
              ].map((item) => (
                <div key={item.title} className={`${item.surface} p-6`}>
                  <span
                    aria-hidden="true"
                    className={`regime-icon-chip h-11 w-11 text-xl ${item.chip}`}
                  >
                    {item.icon}
                  </span>

                  <h3 className="mt-5 font-bold text-regime-blue-dark">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 8. OUR OPERATIONS — real company imagery                   */}
        {/* ---------------------------------------------------------- */}
        <section
          id="our-operations"
          className="scroll-mt-24 bg-gray-50 px-4 py-12 sm:px-6 md:py-16"
        >
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <p className="regime-eyebrow justify-center">Our Operations</p>

              <h2 className="regime-heading text-3xl sm:text-4xl">
                Inside Regime Energy Services
              </h2>

              <p className="regime-lead mx-auto mt-5 max-w-2xl">
                Gas plant operations, filling, product handling, haulage and
                delivery, and the customer service team at work across Imo
                State.
              </p>
            </div>

            {galleryItems.length > 0 ? (
              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {galleryItems.map((item) => (
                  <div
                    key={item.id}
                    className="regime-image overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
                  >
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={item.image_url}
                        alt={
                          item.alt_text ||
                          item.title ||
                          "Regime Energy Services operations"
                        }
                        fill
                        quality={80}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <p className="text-gray-600">
                  Photos of our operations will be displayed here.
                </p>
              </div>
            )}

            <div className="mt-10 text-center">
              <Link href="/gallery" className="regime-button-secondary">
                View Full Gallery
              </Link>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 9. CONTACT REGIME — immediately before the footer          */}
        {/* ---------------------------------------------------------- */}
        <section
          id="contact"
          className="scroll-mt-24 px-4 py-12 sm:px-6 md:py-16"
        >
          <div className="mx-auto max-w-7xl">
            <div className="regime-card-blue p-8 md:p-12">
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
                    {cachedCompany?.phone && (
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-widest text-gray-500">
                          Phone
                        </dt>

                        <dd>
                          <a
                            href={`tel:${cachedCompany.phone}`}
                            className="mt-1 block font-semibold text-regime-blue hover:underline"
                          >
                            {cachedCompany.phone}
                          </a>
                        </dd>
                      </div>
                    )}

                    {cachedCompany?.email && (
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-widest text-gray-500">
                          Email
                        </dt>

                        <dd>
                          <a
                            href={`mailto:${cachedCompany.email}`}
                            className="mt-1 block break-all font-semibold text-regime-blue hover:underline"
                          >
                            {cachedCompany.email}
                          </a>
                        </dd>
                      </div>
                    )}

                    {cachedCompany?.address && (
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-widest text-gray-500">
                          Address
                        </dt>

                        <dd className="mt-1 font-semibold leading-6 text-gray-900">
                          {cachedCompany.address}
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

                    {phoneHref && (
                      <TrackedLink
                        href={phoneHref}
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
