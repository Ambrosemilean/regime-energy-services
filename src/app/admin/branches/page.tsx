import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BranchesTable from "./branches-table";

export default async function BranchesPage() {
  const supabase = await createClient();

  const { data: branches, error } = await supabase
    .from("branches")
    .select(
      `
      id,
      name,
      slug,
      address,
      phone,
      email,
      whatsapp,
      google_maps_url,
      latitude,
      longitude,
      image_url,
      description,
      is_active,
      display_order,
      created_at
      `
    )
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Branches loading error:", error);
  }

  const totalBranches = branches?.length ?? 0;

  const activeBranches =
    branches?.filter((branch) => branch.is_active).length ?? 0;

  const inactiveBranches =
    totalBranches - activeBranches;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Branches
          </h1>

          <p className="mt-2 text-gray-600">
            Manage Regime Energy Services branch locations and contact
            information.
          </p>
        </div>

        <Link
          href="/admin/branches/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add New Branch
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* Total */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Branches
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {totalBranches}
          </p>
        </div>

        {/* Active */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Active Branches
          </p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            {activeBranches}
          </p>
        </div>

        {/* Inactive */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Inactive Branches
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-500">
            {inactiveBranches}
          </p>
        </div>
      </div>

      {/* Branch Locations */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Branch Locations
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            All Regime branch locations currently stored in the system.
          </p>
        </div>

        <BranchesTable branches={branches ?? []} />
      </div>
    </div>
  );
}