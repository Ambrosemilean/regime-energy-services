import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import TrackedView from "@/components/analytics/tracked-view";
import TrackedLink from "@/components/analytics/tracked-link";

type BranchPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getBranch(branchSlug: string) {
  const supabase = await createClient();

  let query = supabase.from("branches").select(`
      id,
      name,
      slug,
      address,
      phone,
      whatsapp,
      email,
      google_maps_url,
      latitude,
      longitude,
      image_url,
      description,
      is_active
    `);

  // The URL may contain either the branch slug or the branch id
  // (older branches may not have a slug set yet). The id column is
  // a UUID, so we can only compare against it when the URL segment
  // actually looks like one — otherwise Postgres errors out.
  query = UUID_REGEX.test(branchSlug)
    ? query.or(`slug.eq.${branchSlug},id.eq.${branchSlug}`)
    : query.eq("slug", branchSlug);

  const { data: branch, error } = await query
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Branch loading error:", error);
  }

  return branch ?? null;
}

export async function generateMetadata({
  params,
}: BranchPageProps): Promise<Metadata> {
  const { slug } = await params;
  const branch = await getBranch(slug);

  if (!branch) {
    return {
      title: "Branch Not Found | Regime Energy Services",
    };
  }

  return {
    title: `${branch.name} | Regime Energy Services`,
    description:
      branch.description ||
      `Contact and location details for the ${branch.name} branch of Regime Energy Services.`,
  };
}

export default async function BranchDetailsPage({
  params,
}: BranchPageProps) {
  const { slug } = await params;

  const branch = await getBranch(slug);

  if (!branch) {
    notFound();
  }

  const whatsappNumber = branch.whatsapp
    ? branch.whatsapp.replace(/\D/g, "")
    : "";

  const phoneNumber = branch.phone
    ? branch.phone.replace(/\s+/g, "")
    : "";

  const hasCoordinates =
    branch.latitude !== null && branch.longitude !== null;

  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${branch.latitude},${branch.longitude}&z=15&output=embed`
    : null;

  return (
    <main className="min-h-screen bg-white">
      {/* Analytics: record this branch view */}
      <TrackedView event="branch_view" label={branch.name} />

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
            href="/branches"
            className="text-sm font-medium text-gray-700 transition hover:text-blue-700"
          >
            ← Back to Branches
          </Link>
        </div>
      </section>

      {/* Branch Details */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          {/* Branch Image */}
          <div>
            <div className="relative overflow-hidden rounded-2xl bg-gray-100">
              {branch.image_url ? (
                <div className="relative aspect-square w-full">
                  <Image
                    src={branch.image_url}
                    alt={branch.name}
                    fill
                    priority
                    quality={90}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center text-gray-400">
                  No branch image available
                </div>
              )}
            </div>

            {/* Google Map */}
            {mapUrl && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200">
                <iframe
                  title={`${branch.name} location map`}
                  src={mapUrl}
                  width="100%"
                  height="320"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="block w-full border-0"
                />
              </div>
            )}

            {!mapUrl && (
              <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                Map location is not currently available for this
                branch.
              </div>
            )}
          </div>

          {/* Branch Information */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              Regime Energy Services Branch
            </p>

            <h1 className="mt-3 text-3xl font-bold text-gray-900 md:text-5xl">
              {branch.name}
            </h1>

            {branch.description && (
              <p className="mt-5 text-lg leading-8 text-gray-600">
                {branch.description}
              </p>
            )}

            <div className="mt-8 h-px bg-gray-200" />

            {/* Contact Details */}
            <div className="mt-8 space-y-5">
              {/* Address */}
              {branch.address && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Address
                  </p>

                  <p className="mt-1 leading-7 text-gray-800">
                    {branch.address}
                  </p>
                </div>
              )}

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
            <div className="mt-8 flex flex-wrap gap-3">
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
                  className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Call Branch
                </TrackedLink>
              )}

              {branch.google_maps_url && (
                <TrackedLink
                  href={branch.google_maps_url}
                  event="maps_click"
                  label={branch.name}
                  className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                >
                  Get Directions
                </TrackedLink>
              )}
            </div>

            <Link
              href="/branches"
              className="mt-8 inline-block text-sm font-semibold text-blue-700 hover:underline"
            >
              ← View all branches
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
