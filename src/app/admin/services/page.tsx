import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ServicesPage() {
  const supabase = await createClient();

  const { data: services, error } = await supabase
    .from("services")
    .select(
      "id, name, slug, short_description, service_category, is_featured, is_active, created_at"
    )
    .order("created_at", { ascending: false });

if (error) {
  console.error("Services fetch error:", {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });
}

  const serviceList = services ?? [];

  const totalServices = serviceList.length;

  const activeServices = serviceList.filter(
    (service) => service.is_active
  ).length;

  const featuredServices = serviceList.filter(
    (service) => service.is_featured
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Services
          </h1>

          <p className="mt-2 text-gray-600">
            Manage the services offered by Regime Energy Services.
          </p>
        </div>

        <Link
          href="/admin/services/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          + Add Service
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Services
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {totalServices}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Active Services
          </p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            {activeServices}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Featured Services
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-600">
            {featuredServices}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load services from the database.
        </div>
      )}

      {/* Services Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-5">
          <h2 className="text-xl font-semibold text-gray-900">
            Service List
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Services currently stored in the database.
          </p>
        </div>

        {serviceList.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              No services yet
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Add your first service to begin building the services
              catalog.
            </p>

            <Link
              href="/admin/services/new"
              className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add Your First Service
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Service
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Category
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Featured
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {serviceList.map((service) => (
                  <tr
                    key={service.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {service.name}
                        </p>

                        {service.short_description && (
                          <p className="mt-1 max-w-md text-sm text-gray-500">
                            {service.short_description}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-600">
                      {service.service_category || "—"}
                    </td>

                    <td className="px-6 py-5">
                      {service.is_active ? (
                        <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      {service.is_featured ? (
                        <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          Featured
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">
                          No
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/admin/services/${service.id}`}
                        className="inline-flex rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Manage
                      </Link>

                      <Link
                        href={`/services/${service.slug}`}
                        target="_blank"
                        className="inline-flex rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                      >
                        Website ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}