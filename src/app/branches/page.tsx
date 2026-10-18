import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TrackedLink from "@/components/analytics/tracked-link";
import TrackedBranchView from "@/components/analytics/tracked-branch-view";

export const metadata = {
  title: "Our Branches | Regime Energy Services",
  description:
    "Explore Regime Energy Services branch locations, contact details, and services across Owerri, Imo State.",
};

export default async function BranchesPage() {
  const supabase = await createClient();

  const { data: branches, error } = await supabase
    .from("branches")
    .select(`
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
      display_order
    `)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Branches loading error:", error);
  }

  const branchList = branches ?? [];

  return (
    <main className="min-h-screen bg-white">
      {/* Analytics: record this branch page visit */}
      <TrackedBranchView />
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-xl font-bold text-blue-700"
          >
            Regime Energy Services
          </Link>

          <Link
            href="/"
            className="text-sm font-medium text-gray-700 transition hover:text-blue-700"
          >
            ← Back Home
          </Link>
        </div>
      </header>

      {/* Page Introduction */}
      <section className="bg-gray-50 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Our Locations
          </p>

          <h1 className="mt-3 text-4xl font-bold text-gray-900 md:text-5xl">
            Find a Regime Branch
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-600">
            Visit a Regime Energy Services location for LPG products,
            gas services, customer support, and other energy solutions.
          </p>
        </div>
      </section>

      {/* Branches */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-20">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
            Unable to load branch locations at this time.
          </div>
        ) : branchList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              No active branches available
            </h2>

            <p className="mt-2 text-gray-500">
              Branch locations will appear here when they are activated
              from the admin dashboard.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {branchList.map((branch) => {
              const whatsappNumber = branch.whatsapp
                ? branch.whatsapp.replace(/\D/g, "")
                : "";

              const phoneNumber = branch.phone
                ? branch.phone.replace(/\s+/g, "")
                : "";

              const hasCoordinates =
                branch.latitude !== null &&
                branch.longitude !== null;

              const mapUrl = hasCoordinates
                ? `https://www.google.com/maps?q=${branch.latitude},${branch.longitude}&z=15&output=embed`
                : null;

              return (
                <article
                  key={branch.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg"
                >
                  {/* Image */}
                  {branch.image_url ? (
                    <div className="relative h-64 w-full bg-gray-100">
                      <Image
                        src={branch.image_url}
                        alt={branch.name}
                        fill
                        quality={90}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center bg-gray-100 text-gray-400">
                      No branch image available
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                      Regime Energy Services
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-gray-900">
                      {branch.name}
                    </h2>

                    {branch.description && (
                      <p className="mt-4 leading-7 text-gray-600">
                        {branch.description}
                      </p>
                    )}

                    <div className="mt-6 space-y-4">
                      {/* Address */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Address
                        </p>

                        <p className="mt-1 text-gray-800">
                          {branch.address}
                        </p>
                      </div>

                      {/* Phone */}
                      {branch.phone && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Phone
                          </p>

                          <TrackedLink
                            href={`tel:${phoneNumber}`}
                            event="phone_click"
                            label={branch.name}
                            target="_self"
                            className="mt-1 inline-block font-medium text-blue-700 hover:underline"
                          >
                            {branch.phone}
                          </TrackedLink>
                        </div>
                      )}

                      {/* Email */}
                      {branch.email && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Email
                          </p>

                          <a
                            href={`mailto:${branch.email}`}
                            className="mt-1 inline-block font-medium text-blue-700 hover:underline"
                          >
                            {branch.email}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-7 flex flex-wrap gap-3">
                      {whatsappNumber && (
                        <TrackedLink
                          href={`https://wa.me/${whatsappNumber}`}
                          event="whatsapp_click"
                          label={branch.name}
                          className="rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                          WhatsApp
                        </TrackedLink>
                      )}

                      {branch.phone && (
                        <TrackedLink
                          href={`tel:${phoneNumber}`}
                          event="phone_click"
                          label={branch.name}
                          target="_self"
                          className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                        >
                          Call Branch
                        </TrackedLink>
                      )}

                      {branch.google_maps_url && (
                        <TrackedLink
                          href={branch.google_maps_url}
                          event="maps_click"
                          label={branch.name}
                          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          Get Directions
                        </TrackedLink>
                      )}
                    </div>

                    {/* Google Map */}
                    {mapUrl && (
                      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
                        <iframe
                          title={`${branch.name} location map`}
                          src={mapUrl}
                          width="100%"
                          height="280"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="block w-full border-0"
                        />
                      </div>
                    )}

                    {/* Missing coordinates notice */}
                    {!mapUrl && (
                      <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                        Map location is not currently available for this
                        branch.
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}