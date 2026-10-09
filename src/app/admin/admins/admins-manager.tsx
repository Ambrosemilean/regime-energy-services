"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminProfile = {
  id: string;
  full_name: string | null;
  role: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

const ROLES = [
  { value: "super_admin", label: "Super Admin" },
  { value: "website_manager", label: "Website Manager" },
  { value: "content_manager", label: "Content Manager" },
  { value: "viewer", label: "Viewer" },
];

export default function AdminsManager({
  admins,
  currentUserId,
}: {
  admins: AdminProfile[];
  currentUserId: string;
}) {
  const router = useRouter();

  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function updateAdmin(
    id: string,
    updates: { role?: string; is_active?: boolean }
  ) {
    setSavingId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to update administrator."
        );
      }

      setSuccess("Administrator updated.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && !error && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Administrators ({admins.length})
        </h2>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                  Admin
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                  Role
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                  Status
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {admins.map((admin) => {
                const isSelf = admin.id === currentUserId;
                const busy = savingId === admin.id;

                return (
                  <tr
                    key={admin.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">
                        {admin.full_name || "Unnamed admin"}

                        {isSelf && (
                          <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            You
                          </span>
                        )}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <select
                        value={admin.role || "viewer"}
                        disabled={isSelf || busy}
                        onChange={(event) =>
                          updateAdmin(admin.id, {
                            role: event.target.value,
                          })
                        }
                        className="rounded-lg border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
                      >
                        {ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-4">
                      {admin.is_active ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                          Disabled
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        disabled={isSelf || busy}
                        onClick={() =>
                          updateAdmin(admin.id, {
                            is_active: !admin.is_active,
                          })
                        }
                        className={`rounded-lg border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                          admin.is_active
                            ? "border-red-200 text-red-600 hover:bg-red-50"
                            : "border-green-200 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {admin.is_active
                          ? "Disable"
                          : "Enable"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
