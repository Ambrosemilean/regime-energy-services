import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CompanySlideshow from "@/components/company-slideshow";
import TrackedLink from "@/components/analytics/tracked-link";

export default async function Home() {
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("company_profile")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const { data: media } = await supabase
    .from("company_media")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  // Load active services from Supabase
  const { data: services } = await supabase
    .from("services")
    .select(
      "id, name, slug, short_description, description, image_url, is_active, display_order"
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  // Load active products from Supabase
  const { data: products } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      short_description,
      description,
      is_active,
      display_order,
      product_images (
        image_url,
        alt_text,
        is_primary,
        display_order
      )
    `
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  // Load active branches from Supabase
  const { data: branches } = await supabase
    .from("branches")
    .select(
      `
      id,
      name,
      address,
      phone,
      whatsapp,
      email,
      google_maps_url,
      latitude,
      longitude,
      image_url,
      description,
      is_active,
      display_order
    `
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  // Load global site settings
  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border--100 bg-blue/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex min-w-0 items-center gap-3">
            {company?.logo_url && (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
                <Image
                  src={company.logo_url}
                  alt={`${company.company_name || "Regime Energy Services"} logo`}
                  fill
                  sizes="48px"
                  priority
                  className="object-contain"
                />
              </div>
            )}

            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-blue-900 sm:text-2xl">
                {company?.company_name || "REGIME ENERGY SERVICES"}
              </h1>

              {company?.tagline && (
                <p className="mt-1 text-sm text-gray-500">{company.tagline}</p>
              )}
            </div>
          </div>
          <nav className="hidden items-center gap-7 md:flex">
            {[
              { href: "#about", label: "About" },
              { href: "#services", label: "Services" },
              { href: "#products", label: "Products" },
              { href: "#branches", label: "Branches" },
              { href: "/company-history", label: "Our History", isLink: true },
              { href: "#contact", label: "Contact" },
            ].map((item) => {
              const className =
                "nav-link relative rounded text-[13px] font-medium tracking-wide text-slate-600 hover:text-blue-800 hover:[text-shadow:0_1px_2px_rgb(37_99_235/0.18)] focus-visible:text-blue-800";

              return item.isLink ? (
                <Link key={item.href} href={item.href} className={className}>
                  {item.label}
                </Link>
              ) : (
                <a key={item.href} href={item.href} className={className}>
                  {item.label}
                </a>
              );
            })}
          </nav>

          <a
            href="#contact"
            className="rounded-lg bg-blue-700 px-7 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            Contact Us
          </a>
        </div>
      </header>

      {/* Hero Slideshow */}
      {media && media.length > 0 ? (
        <CompanySlideshow media={media} />
      ) : (
        <section className="bg-blue-900 px-6 py-28 text-white">
          <div className="mx-auto max-w-7xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-yellow-400">
              Regime Energy Services
            </p>

            <h2 className="max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
              Reliable LPG Energy Solutions for Homes and Businesses
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
              Safe, reliable and efficient LPG supply, distribution,
              delivery and related energy services.
            </p>
          </div>
        </section>
      )}

      {/* Hero Introduction */}
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-widest text-red-600">
              Regime Energy Services
            </p>

            <h2 className="mt-3 text-3xl font-bold text-gray-900 md:text-5xl">
              Powering everyday life with dependable LPG solutions.
            </h2>

            <p className="mt-6 text-lg leading-8 text-gray-600">
              {company?.short_description ||
                "Regime Energy Services provides LPG supply, distribution, delivery and related energy services for residential, commercial and industrial customers."}
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#services"
              className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
            >
              Our Services
            </a>

            <a
              href="#products"
              className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-800 hover:bg-gray-50"
            >
              View Products
            </a>

            <a
              href="#branches"
              className="rounded-lg border border-blue-700 px-6 py-3 font-semibold text-blue-700 hover:bg-blue-50"
            >
              Find a Branch
            </a>

            <a
              href="#contact"
              className="rounded-lg border border-red-600 px-6 py-3 font-semibold text-red-600 hover:bg-red-50"
            >
              Contact Regime
            </a>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
                About Regime
              </p>

              <h2 className="mt-3 text-3xl font-bold text-gray-900">
                Built around safe and dependable energy service
              </h2>
            </div>

            <div>
              <p className="text-lg leading-8 text-gray-600">
                {company?.full_description ||
                  company?.short_description ||
                  "Regime Energy Services is focused on dependable LPG supply, distribution and customer-focused energy services."}
              </p>
            </div>
          </div>

          {(company?.mission || company?.vision) && (
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {company?.mission && (
                <div className="rounded-2xl bg-white p-8 shadow-sm">
                  <h3 className="text-xl font-bold text-blue-900">
                    Our Mission
                  </h3>

                  <p className="mt-4 leading-7 text-gray-600">
                    {company.mission}
                  </p>
                </div>
              )}

              {company?.vision && (
                <div className="rounded-2xl bg-white p-8 shadow-sm">
                  <h3 className="text-xl font-bold text-red-700">
                    Our Vision
                  </h3>

                  <p className="mt-4 leading-7 text-gray-600">
                    {company.vision}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Services Preview */}
      <section id="services" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-red-600">
              What We Do
            </p>

            <h2 className="mt-3 text-3xl font-bold text-gray-900 md:text-4xl">
              Energy and support services
            </h2>

            <p className="mt-4 leading-7 text-gray-600">
              Explore the range of services available from Regime
              Energy Services.
            </p>
          </div>

          {services && services.length > 0 ? (
            <>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {services.slice(0, 4).map((service) => (
                  <Link
                    key={service.id}
                    href={`/services/${service.slug}`}
                    className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    {service.image_url ? (
                      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                        <Image
                          src={service.image_url}
                          alt={service.name}
                          fill
                          quality={85}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex h-48 w-full items-center justify-center bg-blue-50">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-bold text-blue-700 shadow-sm">
                          âœ“
                        </div>
                      </div>
                    )}

                    <div className="p-7">
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-700">
                        {service.name}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-gray-600">
                        {service.short_description ||
                          service.description ||
                          "Professional and dependable service from Regime Energy Services."}
                      </p>

                      <span className="mt-5 inline-block text-sm font-semibold text-blue-700">
                        Learn More â†’
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {services.length > 4 && (
                <div className="mt-10 text-center">
                  <Link
                    href="/services"
                    className="inline-block rounded-lg border border-blue-700 px-7 py-3 font-semibold text-blue-700 transition hover:bg-blue-700 hover:text-white"
                  >
                    View All Services
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
              <p className="text-gray-600">
                Our services will be displayed here.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Weighbridge */}
      <section className="bg-blue-900 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-yellow-400">
                Featured Service
              </p>

              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Weighbridge Services
              </h2>

              <p className="mt-5 max-w-xl leading-8 text-blue-100">
                Accurate weighing services for vehicles and loads,
                supported by Regime Energy Services.
              </p>

              <a
                href="#contact"
                className="mt-8 inline-block rounded-lg bg-yellow-400 px-6 py-3 font-bold text-gray-900 hover:bg-yellow-300"
              >
                Enquire About Weighbridge
              </a>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-8">
              <p className="text-4xl font-bold">1kg = 1kg</p>

              <p className="mt-3 text-blue-100">
                Accurate dispensing and dependable measurement are
                part of our service commitment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
              Products
            </p>

            <h2 className="mt-3 text-3xl font-bold text-gray-900 md:text-4xl">
              LPG products and accessories
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">
              Explore cylinders, regulators, valves, burners, cookers,
              hoses and other LPG accessories available from Regime.
            </p>
          </div>

          {products && products.length > 0 ? (
            <>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product) => {
                  const productImages = Array.isArray(
                    product.product_images
                  )
                    ? [...product.product_images].sort(
                        (a, b) =>
                          (a.display_order ?? 0) -
                          (b.display_order ?? 0)
                      )
                    : [];

                  const primaryProductImage =
                    productImages.find(
                      (image) => image.is_primary === true
                    ) ?? productImages[0];

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      {primaryProductImage ? (
                        <div className="relative h-52 w-full overflow-hidden bg-gray-100">
                          <Image
                            src={primaryProductImage.image_url}
                            alt={
                              primaryProductImage.alt_text ||
                              product.name
                            }
                            fill
                            quality={85}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="flex h-52 w-full items-center justify-center bg-blue-50">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-bold text-blue-700 shadow-sm">
                            LPG
                          </div>
                        </div>
                      )}

                      <div className="p-6">
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-700">
                          {product.name}
                        </h3>

                        <p className="mt-3 text-sm leading-6 text-gray-600">
                          {product.short_description ||
                            product.description ||
                            "Quality LPG product available from Regime Energy Services."}
                        </p>

                        <span className="mt-5 inline-block text-sm font-semibold text-blue-700">
                          View Product â†’
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-10 text-center">
                <Link
                  href="/products"
                  className="inline-block rounded-lg bg-blue-700 px-7 py-3 font-semibold text-white transition hover:bg-blue-800"
                >
                  View All Products
                </Link>
              </div>
            </>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <p className="text-gray-600">
                Our LPG products and accessories will be displayed here.
              </p>

              <Link
                href="/products"
                className="mt-5 inline-block font-semibold text-blue-700 hover:text-blue-800"
              >
                Explore Products â†’
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Branches */}
      <section id="branches" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-red-600">
              Our Locations
            </p>

            <h2 className="mt-3 text-3xl font-bold text-gray-900 md:text-4xl">
              Find a Regime branch near you
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">
              Visit any of our active branch locations for LPG products,
              services, enquiries and customer support.
            </p>
          </div>

          {branches && branches.length > 0 ? (
            <>
              <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {branches.slice(0, 6).map((branch) => {
                  const hasCoordinates =
                    branch.latitude !== null &&
                    branch.longitude !== null;

                  const mapUrl =
                    hasCoordinates
                      ? `https://www.google.com/maps?q=${branch.latitude},${branch.longitude}&z=15&output=embed`
                      : null;

                  return (
                    <div
                      key={branch.id}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                    >
                      {branch.image_url ? (
                        <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                          <Image
                            src={branch.image_url}
                            alt={branch.name}
                            fill
                            quality={85}
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-56 w-full items-center justify-center bg-blue-50">
                          <span className="text-lg font-bold text-blue-700">
                            Regime Branch
                          </span>
                        </div>
                      )}

                      <div className="p-7">
                        <h3 className="text-xl font-bold text-gray-900">
                          {branch.name}
                        </h3>

                        {branch.description && (
                          <p className="mt-3 text-sm leading-6 text-gray-600">
                            {branch.description}
                          </p>
                        )}

                        {branch.address && (
                          <div className="mt-5">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                              Address
                            </p>

                            <p className="mt-1 text-sm leading-6 text-gray-800">
                              {branch.address}
                            </p>
                          </div>
                        )}

                        {/* Google Map */}
                        {mapUrl && (
                          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
                            <iframe
                              title={`${branch.name} location map`}
                              src={mapUrl}
                              width="100%"
                              height="260"
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              className="block w-full border-0"
                            />
                          </div>
                        )}

                        <div className="mt-6 flex flex-wrap gap-3">
                          {branch.phone && (
                            <TrackedLink
                              href={`tel:${branch.phone}`}
                              event="phone_click"
                              label={branch.name}
                              target=""
                              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                            >
                              Call Branch
                            </TrackedLink>
                          )}

                          {branch.whatsapp && (
                            <TrackedLink
                              href={`https://wa.me/${branch.whatsapp.replace(
                                /\D/g,
                                ""
                              )}`}
                              event="whatsapp_click"
                              label={branch.name}
                              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                            >
                              WhatsApp
                            </TrackedLink>
                          )}

                          {branch.google_maps_url && (
                            <TrackedLink
                              href={branch.google_maps_url}
                              event="maps_click"
                              label={branch.name}
                              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                            >
                              Open in Google Maps
                            </TrackedLink>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {branches.length > 6 && (
                <div className="mt-10 text-center">
                  <Link
                    href="/branches"
                    className="inline-block rounded-lg border border-blue-700 px-7 py-3 font-semibold text-blue-700 transition hover:bg-blue-700 hover:text-white"
                  >
                    View All Branches
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
              <p className="text-gray-600">
                Our branch locations will be displayed here.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-white p-8 shadow-sm md:p-12">
            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-red-600">
                  Contact Regime
                </p>

                <h2 className="mt-3 text-3xl font-bold text-gray-900">
                  Let&apos;s help with your energy needs
                </h2>

                <p className="mt-5 leading-7 text-gray-600">
                  Contact Regime Energy Services for LPG supply,
                  delivery, services and enquiries.
                </p>
              </div>

              <div className="space-y-5">
                {company?.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Phone
                    </p>

                    <a
                      href={`tel:${company.phone}`}
                      className="mt-1 block font-semibold text-blue-700"
                    >
                      {company.phone}
                    </a>
                  </div>
                )}

                {company?.email && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Email
                    </p>

                    <a
                      href={`mailto:${company.email}`}
                      className="mt-1 block font-semibold text-blue-700"
                    >
                      {company.email}
                    </a>
                  </div>
                )}

                {company?.address && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Address
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {company.address}
                    </p>
                  </div>
                )}

                {company?.whatsapp && (
                  <a
                    href={`https://wa.me/${company.whatsapp.replace(
                      /\D/g,
                      ""
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
                  >
                    Chat on WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-bold">
                {company?.company_name || "REGIME ENERGY SERVICES"}
              </p>

              <p className="mt-1 text-sm text-gray-400">
                {siteSettings?.footer_note ||
                  "Reliable LPG energy solutions."}
              </p>

              {siteSettings?.show_company_history_link && (
                <Link
                  href="/company-history"
                  className="mt-3 inline-block text-sm font-semibold text-gray-300 hover:text-white"
                >
                  Our History â†’
                </Link>
              )}
            </div>

            {/* Social links */}
            {siteSettings &&
              (siteSettings.facebook_url ||
                siteSettings.instagram_url ||
                siteSettings.twitter_url ||
                siteSettings.linkedin_url ||
                siteSettings.youtube_url) && (
                <div className="flex flex-wrap gap-3">
                  {siteSettings.facebook_url && (
                    <a
                      href={siteSettings.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-gray-800"
                    >
                      Facebook
                    </a>
                  )}

                  {siteSettings.instagram_url && (
                    <a
                      href={siteSettings.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-gray-800"
                    >
                      Instagram
                    </a>
                  )}

                  {siteSettings.twitter_url && (
                    <a
                      href={siteSettings.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-gray-800"
                    >
                      X / Twitter
                    </a>
                  )}

                  {siteSettings.linkedin_url && (
                    <a
                      href={siteSettings.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-gray-800"
                    >
                      LinkedIn
                    </a>
                  )}

                  {siteSettings.youtube_url && (
                    <a
                      href={siteSettings.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-gray-800"
                    >
                      YouTube
                    </a>
                  )}
                </div>
              )}
          </div>

          <p className="mt-8 border-t border-gray-800 pt-6 text-sm text-gray-500">
            Â© {new Date().getFullYear()} Regime Energy Services.
            All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}