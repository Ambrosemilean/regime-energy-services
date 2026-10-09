/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Branch = {
  id: string;
  name: string;
  slug: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number | null;
  created_at: string;
};

export default function BranchesTable({
  branches,
}: {
  branches: Branch[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filteredBranches = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();

    return branches.filter((branch) => {
      const matchesSearch =
        !searchTerm ||
        branch.name.toLowerCase().includes(searchTerm) ||
        (branch.address || "").toLowerCase().includes(searchTerm) ||
        (branch.phone || "").toLowerCase().includes(searchTerm) ||
        (branch.email || "").toLowerCase().includes(searchTerm);

      const matchesStatus =
        status === "all" ||
        (status === "active" && branch.is_active) ||
        (status === "inactive" && !branch.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [branches, search, status]);

  return (
    <div>
      {/* Search and Filter */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row">
          {/* Search */}
          <div className="flex-1">
            <label
              htmlFor="branch-search"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Search branches
            </label>

            <input
              id="branch-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, address, phone or email..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-52">
            <label
              htmlFor="branch-status"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Status
            </label>

            <select
              id="branch-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Branches</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-700">
              {filteredBranches.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-700">
              {branches.length}
            </span>{" "}
            branches
          </p>

          {(search || status !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatus("all");
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Branch Table */}
      {filteredBranches.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Branch
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Contact
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Order
                </th>

                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredBranches.map((branch) => (
                <tr
                  key={branch.id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      {branch.image_url ? (
                        <img
                          src={branch.image_url}
                          alt={branch.name}
                          className="h-14 w-14 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                          No image
                        </div>
                      )}

                      <div>
                        <p className="font-semibold text-gray-900">
                          {branch.name}
                        </p>

                        <p className="mt-1 max-w-md text-sm text-gray-500">
                          {branch.address ||
                            "No address provided"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="space-y-1 text-sm">
                      {branch.phone && (
                        <p className="text-gray-700">
                          {branch.phone}
                        </p>
                      )}

                      {branch.email && (
                        <p className="text-gray-500">
                          {branch.email}
                        </p>
                      )}

                      {branch.whatsapp && (
                        <p className="text-green-600">
                          WhatsApp: {branch.whatsapp}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    {branch.is_active ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                        Inactive
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-5 text-sm text-gray-600">
                    {branch.display_order ?? 0}
                  </td>

                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-4">
                      <Link
                        href={`/admin/branches/${branch.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>

                      <Link
                        href={`/admin/branches/${branch.id}/edit`}
                        className="font-medium text-gray-700 hover:text-gray-900"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <p className="font-medium text-gray-700">
            No branches found.
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Try changing your search or status filter.
          </p>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatus("all");
            }}
            className="mt-4 font-medium text-blue-600 hover:text-blue-800"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}