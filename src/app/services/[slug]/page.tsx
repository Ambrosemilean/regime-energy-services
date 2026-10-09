import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ServicePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ServiceDetailsPage({
  params,
}: ServicePageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  // Get active company WhatsApp number
  const { data: company } = await supabase
    .from("company_profile")
    .select("whatsapp")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const whatsappNumber = company?.whatsapp
    ? company.whatsapp.replace(/\D/g, "")
    : "";

  // Get service
  const { data: service, error } = await supabase
    .from("services")
    .select(`
      id,
      name,
      slug,
      short_description,
      description,
      image_url,
      availability,
      service_category,
      is_active
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Service loading error:", error);
  }

  if (!service) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-xl font-bold text-blue-700"
          >
            Regime Energy Services
          </Link>

          <Link
            href="/#services"
            className="text-sm font-medium text-gray-700 transition hover:text-blue-700"
          >
            ← Back to Services
          </Link>
        </div>
      </section>

      {/* Service Details */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          {/* Service Image */}
          <div className="relative overflow-hidden rounded-2xl bg-gray-100">
            {service.image_url ? (
              <div className="relative aspect-square w-full">
                <Image
                  src={service.image_url}
                  alt={service.name}
                  fill
                  priority
                  quality={90}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center text-gray-400">
                No service image available
              </div>
            )}
          </div>

          {/* Service Information */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              {service.service_category || "Our Services"}
            </p>

            <h1 className="mt-3 text-3xl font-bold text-gray-900 md:text-5xl">
              {service.name}
            </h1>

            {service.short_description && (
              <p className="mt-5 text-lg leading-8 text-gray-600">
                {service.short_description}
              </p>
            )}

            {/* Availability */}
            {service.availability && (
              <div className="mt-6">
                <span
                  className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                    service.availability === "available"
                      ? "bg-green-100 text-green-700"
                      : service.availability === "on_request"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {service.availability === "available"
                    ? "Available"
                    : service.availability === "on_request"
                      ? "On Request"
                      : service.availability}
                </span>
              </div>
            )}

            <div className="mt-8 h-px bg-gray-200" />

            {/* Description */}
            {service.description && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900">
                  About This Service
                </h2>

                <p className="mt-4 whitespace-pre-line leading-8 text-gray-600">
                  {service.description}
                </p>
              </div>
            )}

            {/* WhatsApp Enquiry */}
            <div className="mt-10 rounded-2xl bg-gray-50 p-6">
              <h2 className="text-lg font-bold text-gray-900">
                Need this service?
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Contact Regime Energy Services for scheduling,
                pricing, and service enquiries.
              </p>

              {whatsappNumber ? (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
                >
                  Enquire on WhatsApp
                </a>
              ) : (
                <p className="mt-5 text-sm font-medium text-gray-500">
                  WhatsApp contact is currently unavailable.
                </p>
              )}
            </div>

            <Link
              href="/#services"
              className="mt-6 inline-block text-sm font-semibold text-blue-700 hover:underline"
            >
              ← View all services
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}