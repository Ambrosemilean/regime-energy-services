import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Our Services — Regime Energy Services",
  description:
    "Explore the range of LPG supply, distribution and energy services available from Regime Energy Services.",
};

type ServicesPageProps = {
  searchParams: Promise<{
    search?: string;
  }>;
};

export default async function ServicesListPage({
  searchParams,
}: ServicesPageProps) {
  const supabase = await createClient();

  const params = await searchParams;
  const search = params.search?.trim() || "";

  let query = supabase
    .from("services")
    .select(
      `
      id,
      name,
      slug,
      short_description,
      description,
      image_url,
      service_category
    `
    )
    .eq("is_active", true);

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,short_description.ilike.%${search}%,description.ilike.%${search}%,service_category.ilike.%${search}%`
    );
  }

  const { data: services, error } = await query
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  const serviceList = services ?? [];

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
            href="/"
            className="text-sm font-medium text-gray-700 hover:text-blue-700"
          >
            ← Back to Home
          </Link>
        </div>
      </section>

      {/* Page Intro */}
      <section className="mx-auto max-w-7xl px-6 pb-6 pt-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
          Regime Energy Services
        </p>

        <h1 className="mt-3 text-3xl font-bold text-gray-900 md:text-5xl">
          Our Services
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-600">
          Explore the range of services available from Regime
          Energy Services.
        </p>
      </section>

      {/* Service Search */}
      <section className="mx-auto max-w-3xl px-6 pb-10">
        <form
          method="GET"
          action="/services"
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <label
              htmlFor="service-search"
              className="sr-only"
            >
              Search services
            </label>

            <input
              id="service-search"
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Search services e.g. delivery, repairs, haulage..."
              className="w-full rounded-xl border border-gray-300 bg-white px-5 py-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-blue-700 px-7 py-4 font-semibold text-white transition hover:bg-blue-800"
          >
            Search
          </button>

          {search && (
            <Link
              href="/services"
              className="rounded-xl border border-gray-300 px-7 py-4 text-center font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Clear
            </Link>
          )}
        </form>

        {search && (
          <p className="mt-4 text-center text-sm text-gray-500">
            Showing results for{" "}
            <span className="font-semibold text-gray-800">
              &quot;{search}&quot;
            </span>
          </p>
        )}
      </section>

      {/* Services Grid */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-700">
            Unable to load services right now. Please try again
            later.
          </div>
        )}

        {!error && serviceList.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 p-14 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {search
                ? "No matching services found"
                : "No services listed yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              {search
                ? "Try another service name or search term."
                : "Our service catalogue is being updated. Please check back soon or contact us directly for enquiries."}
            </p>

            {search && (
              <Link
                href="/services"
                className="mt-5 inline-block rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800"
              >
                View All Services
              </Link>
            )}
          </div>
        )}

        {!error && serviceList.length > 0 && (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {serviceList.map((service) => (
              <Link
                key={service.id}
                href={`/services/${service.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative h-52 w-full overflow-hidden bg-gray-50">
                  {service.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-blue-50">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-bold text-blue-700 shadow-sm">
                        ✓
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-6">
                  {service.service_category && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                      {service.service_category}
                    </p>
                  )}

                  <h2 className="mt-2 text-lg font-semibold text-gray-900 group-hover:text-blue-700">
                    {service.name}
                  </h2>

                  <p className="mt-2 flex-1 text-sm leading-6 text-gray-600">
                    {service.short_description ||
                      service.description ||
                      "Professional and dependable service from Regime Energy Services."}
                  </p>

                  <span className="mt-4 inline-block text-sm font-semibold text-blue-700 group-hover:underline">
                    Learn more →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}