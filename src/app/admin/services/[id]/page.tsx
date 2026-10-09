/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ServicePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ServicePage({
  params,
}: ServicePageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: service, error } = await supabase
    .from("services")
    .select(
      `
      id,
      name,
      slug,
      short_description,
      description,
      service_category,
      image_url,
      is_featured,
      is_active,
      created_at,
      updated_at
      `
    )
    .eq("id", id)
    .single();

  if (error || !service) {
    notFound();
  }

  const { data: images } = await supabase
    .from("service_images")
    .select(
      `
      id,
      image_url,
      alt_text,
      image_type,
      display_order,
      is_primary
      `
    )
    .eq("service_id", id)
    .order("display_order", { ascending: true });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {service.name}
          </h1>

          <p className="mt-2 text-gray-600">
            Service details and images
          </p>
        </div>

        <Link
          href="/admin/services"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Back to Services
        </Link>
      </div>

      {/* Service information */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main information */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Service Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Details stored in Supabase
              </p>
            </div>

            <div className="flex gap-2">
              {service.is_active && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  Active
                </span>
              )}

              {service.is_featured && (
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                  Featured
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Service Name
              </p>

              <p className="mt-1 text-gray-900">
                {service.name}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">
                Category
              </p>

              <p className="mt-1 text-gray-900">
                {service.service_category || "Not specified"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">
                Short Description
              </p>

              <p className="mt-1 text-gray-700">
                {service.short_description || "No short description provided."}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">
                Full Description
              </p>

              <p className="mt-1 whitespace-pre-wrap text-gray-700">
                {service.description || "No full description provided."}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">
                Slug
              </p>

              <p className="mt-1 font-mono text-sm text-gray-700">
                {service.slug}
              </p>
            </div>
          </div>
        </div>

        {/* Primary image */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Primary Image
          </h2>

          {service.image_url ? (
            <div className="mt-5 overflow-hidden rounded-lg border border-gray-200">
              <img
                src={service.image_url}
                alt={service.name}
                className="h-64 w-full object-cover"
              />
            </div>
          ) : (
            <div className="mt-5 flex h-64 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-500">
              No primary image
            </div>
          )}
        </div>
      </div>

      {/* Image gallery */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Service Images
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {images?.length || 0} image
              {(images?.length || 0) === 1 ? "" : "s"} uploaded
            </p>
          </div>
        </div>

        {images && images.length > 0 ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <div
                key={image.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
              >
                <img
                  src={image.image_url}
                  alt={image.alt_text || service.name}
                  className="h-56 w-full object-cover"
                />

                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium capitalize text-gray-900">
                      {image.image_type}
                    </span>

                    {image.is_primary && (
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                        Primary
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-lg bg-gray-50 p-8 text-center text-gray-500">
            No service images have been uploaded.
          </div>
        )}
      </div>
    </div>
  );
}