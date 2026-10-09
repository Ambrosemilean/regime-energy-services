/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeleteBranchButton from "./delete-branch-button";

export default async function BranchViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: branch, error } = await supabase
    .from("branches")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !branch) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/admin/branches"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to Branches
          </Link>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            {branch.name}
          </h1>

          <p className="mt-2 text-gray-600">
            Branch details and information.
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${
            branch.is_active
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {branch.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Main Image */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {branch.image_url ? (
          <img
            src={branch.image_url}
            alt={branch.name}
            className="h-[400px] w-full object-cover"
          />
        ) : (
          <div className="flex h-[300px] items-center justify-center bg-gray-100 text-gray-500">
            No branch image uploaded
          </div>
        )}
      </div>

      {/* Branch Information */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Branch Information
          </h2>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-sm text-gray-500">Branch Name</p>
              <p className="mt-1 font-medium text-gray-900">
                {branch.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="mt-1 text-gray-900">
                {branch.address || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="mt-1 text-gray-900">
                {branch.description || "No description provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Display Order</p>
              <p className="mt-1 font-medium text-gray-900">
                {branch.display_order ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Contact Information
          </h2>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-sm text-gray-500">Phone</p>

              {branch.phone ? (
                <a
                  href={`tel:${branch.phone}`}
                  className="mt-1 block font-medium text-blue-600 hover:underline"
                >
                  {branch.phone}
                </a>
              ) : (
                <p className="mt-1 text-gray-900">Not provided</p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500">WhatsApp</p>

              {branch.whatsapp ? (
                <a
                  href={`https://wa.me/${branch.whatsapp.replace(
                    /\D/g,
                    ""
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block font-medium text-green-600 hover:underline"
                >
                  {branch.whatsapp}
                </a>
              ) : (
                <p className="mt-1 text-gray-900">Not provided</p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>

              {branch.email ? (
                <a
                  href={`mailto:${branch.email}`}
                  className="mt-1 block font-medium text-blue-600 hover:underline"
                >
                  {branch.email}
                </a>
              ) : (
                <p className="mt-1 text-gray-900">Not provided</p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500">Google Maps</p>

              {branch.google_maps_url ? (
                <a
                  href={branch.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block font-medium text-blue-600 hover:underline"
                >
                  Open Location in Google Maps →
                </a>
              ) : (
                <p className="mt-1 text-gray-900">
                  Location link not provided
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Coordinates */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Location Coordinates
        </h2>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Latitude</p>
            <p className="mt-1 font-medium text-gray-900">
              {branch.latitude ?? "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Longitude</p>
            <p className="mt-1 font-medium text-gray-900">
              {branch.longitude ?? "Not provided"}
            </p>
          </div>
        </div>
      </div>

{/* Actions */}
<div className="flex flex-wrap gap-4">
  <Link
    href={`/admin/branches/${branch.id}/edit`}
    className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
  >
    Edit Branch
  </Link>

  <DeleteBranchButton
    branchId={branch.id}
    branchName={branch.name}
  />

  <Link
    href="/admin/branches"
    className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
  >
    Back to Branches
  </Link>
</div>
  </div>
  );
}