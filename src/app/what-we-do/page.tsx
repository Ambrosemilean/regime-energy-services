import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import ScrollRow from "@/components/scroll-row";
import QuickActions from "@/components/whatsapp-actions";
import { getActiveCompanyProfile } from "@/components/site-header";

export const metadata = buildMetadata({
  title: "What We Do — LPG Products & Energy Services",
  description:
    "Gas cylinders, regulators, cookers, hoses and LPG equipment, plus supply, delivery, haulage, repairs, weighbridge and safety services from Regime Energy Services across Imo State.",
  path: "/what-we-do",
});

type CategoryCard = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
};

type ServiceCard = {
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  imageUrl: string | null;
};

export default async function WhatWeDoPage() {
  const supabase = await createClient();

  // One parallel batch for everything the page needs.
  const [{ data: categories }, { data: categoryImages }, { data: services }] =
    await Promise.all([
      supabase
        .from("product_categories")
        .select("id, name, slug, description")
        .order("name", { ascending: true }),
      supabase
        .from("product_images")
        .select("image_url, product_id, products!inner(category_id)")
        .order("is_primary", { ascending: false }),
      supabase
        .from("services")
        .select("name, slug, short_description, description, image_url, service_category, is_active")
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
    ]);

  // Representative image per product category: the primary image of the
  // first product that belongs to the category and has any image.
  const productIdsByCategory = new Map<string, string>();

  const { data: products } = await supabase
    .from("products")
    .select("id, category_id")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (products) {
    for (const product of products) {
      if (
        product.category_id &&
        !productIdsByCategory.has(product.category_id)
      ) {
        productIdsByCategory.set(product.category_id, product.id);
      }
    }
  }

  const imageByProductId = new Map<string, string>();
  if (categoryImages) {
    for (const image of categoryImages as {
      image_url: string;
      product_id: string;
    }[]) {
      if (!imageByProductId.has(image.product_id)) {
        imageByProductId.set(image.product_id, image.image_url);
      }
    }
  }

  const productCategories: CategoryCard[] = (categories ?? []).map(
    (category) => {
      const productId = productIdsByCategory.get(category.id);

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description ?? null,
        imageUrl: productId
          ? imageByProductId.get(productId) ?? null
          : null,
      };
    }
  );

  // Services are shown individually; each links to its detail module.
  const serviceCards: ServiceCard[] = ((services ?? []) as {
    name: string;
    slug: string;
    short_description: string | null;
    description: string | null;
    image_url: string | null;
    service_category: string | null;
  }[]).map((service) => ({
    name: service.name,
    slug: service.slug,
    category: service.service_category,
    description: service.short_description ?? service.description ?? null,
    imageUrl: service.image_url,
  }));

  const company = await getActiveCompanyProfile();
  const intro =
    company?.short_description ??
    "Quality LPG products and dependable energy services — supplied, delivered and supported by Regime Energy Services across Imo State.";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader currentPath="/what-we-do" />

      <main className="flex-1">
        {/* Intro */}
        <section className="mx-auto max-w-7xl px-4 pb-8 pt-10 text-center sm:px-6 md:pt-14">
          <p className="regime-eyebrow justify-center">Regime Energy Services</p>

          <h1 className="regime-heading mt-3 text-3xl sm:text-4xl md:text-5xl">
            What We Do
          </h1>

          <p className="regime-lead mx-auto mt-4 max-w-2xl">{intro}</p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="#our-products" className="regime-button-primary">
              Our Products
            </Link>

            <Link href="#our-services" className="regime-button-secondary">
              Our Services
            </Link>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <QuickActions />
        </div>

        {/* Our Products */}
        <section
          id="our-products"
          className="scroll-mt-24 px-4 py-12 sm:px-6 md:py-14"
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="regime-eyebrow">Our Products</p>

                <h2 className="regime-heading text-2xl sm:text-3xl">
                  LPG Products &amp; Accessories
                </h2>
              </div>

              <Link
                href="/products"
                className="hidden shrink-0 text-sm font-semibold text-regime-blue hover:underline sm:block"
              >
                View all products →
              </Link>
            </div>

            {productCategories.length > 0 ? (
              <div className="mt-8">
                <ScrollRow ariaLabel="Product categories">
                  {productCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/products/category/${category.slug}`}
                      className="regime-card group w-64 shrink-0 snap-start overflow-hidden sm:w-72"
                    >
                      <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                        {category.imageUrl ? (
                          <Image
                            src={category.imageUrl}
                            alt={category.name}
                            fill
                            quality={85}
                            sizes="(max-width: 640px) 80vw, 288px"
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-regime-blue/5">
                            <span className="text-sm font-bold uppercase tracking-widest text-regime-blue">
                              {category.name}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 group-hover:text-regime-blue">
                          {category.name}
                        </h3>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                          {category.description ??
                            "Quality LPG products available from Regime Energy Services."}
                        </p>

                        <span className="mt-4 inline-block text-sm font-bold text-regime-blue group-hover:underline">
                          Read More →
                        </span>
                      </div>
                    </Link>
                  ))}
                </ScrollRow>

                <Link
                  href="/products"
                  className="mt-2 inline-block text-sm font-semibold text-regime-blue hover:underline sm:hidden"
                >
                  View all products →
                </Link>
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-600">
                Our product catalogue is being updated. Please contact us
                directly for enquiries.
              </div>
            )}
          </div>
        </section>

        {/* Our Services */}
        <section
          id="our-services"
          className="scroll-mt-24 bg-gray-50 px-4 py-12 sm:px-6 md:py-14"
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="regime-eyebrow">Our Services</p>

                <h2 className="regime-heading text-2xl sm:text-3xl">
                  Energy Services Across Imo State
                </h2>
              </div>

              <Link
                href="/services"
                className="hidden shrink-0 text-sm font-semibold text-regime-blue hover:underline sm:block"
              >
                View all services →
              </Link>
            </div>

            {serviceCards.length > 0 ? (
              <div className="mt-8">
                <ScrollRow ariaLabel="Our services">
                  {serviceCards.map((service) => (
                    <Link
                      key={service.slug}
                      href={`/services/${service.slug}`}
                      className="regime-card group w-64 shrink-0 snap-start overflow-hidden sm:w-72"
                    >
                      <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                        {service.imageUrl ? (
                          <Image
                            src={service.imageUrl}
                            alt={service.name}
                            fill
                            quality={85}
                            sizes="(max-width: 640px) 80vw, 288px"
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-regime-blue/5">
                            <span className="text-sm font-bold uppercase tracking-widest text-regime-blue">
                              {service.category || "Service"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 group-hover:text-regime-blue">
                          {service.name}
                        </h3>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                          {service.description ??
                            "Professional and dependable service from Regime Energy Services."}
                        </p>

                        <span className="mt-4 inline-block text-sm font-bold text-regime-blue group-hover:underline">
                          Read More →
                        </span>
                      </div>
                    </Link>
                  ))}
                </ScrollRow>

                <Link
                  href="/services"
                  className="mt-2 inline-block text-sm font-semibold text-regime-blue hover:underline sm:hidden"
                >
                  View all services →
                </Link>
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
                Our service catalogue is being updated. Please contact us
                directly for enquiries.
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
