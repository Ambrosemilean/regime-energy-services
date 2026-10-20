"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminProfile = {
  id: string;
  full_name: string | null;
  role: string | null;
  is_active: boolean | null;
  phone: string | null;
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
  emailById,
  currentUserId,
  superAdminCount,
}: {
  admins: AdminProfile[];
  emailById: Record<string, string | null>;
  currentUserId: string;
  superAdminCount: number;
}) {
  const router = useRouter();

  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add admin form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer");
  const [adding, setAdding] = useState(false);

  // Edit modal state
  const [editingAdmin, setEditingAdmin] = useState<AdminProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);

  function openEditModal(admin: AdminProfile) {
    setEditingAdmin(admin);
    setEditName(admin.full_name || "");
    setEditPhone(admin.phone || "");
    setEditPassword("");
    setError("");
    setSuccess("");
  }

  function closeEditModal() {
    setEditingAdmin(null);
    setEditName("");
    setEditPhone("");
    setEditPassword("");
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();

    if (!editingAdmin) return;

    const updates: {
      full_name?: string;
      phone?: string | null;
      password?: string;
    } = {
      full_name: editName.trim(),
      phone: editPhone.trim() === "" ? null : editPhone.trim(),
    };

    if (editPassword) {
      updates.password = editPassword;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingAdmin.id, ...updates }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to save administrator details."
        );
      }

      setSuccess("Administrator credentials saved.");
      closeEditModal();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

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

  async function addAdmin(event: React.FormEvent) {
    event.preventDefault();
    setAdding(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, phone, password, role }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to create administrator."
        );
      }

      setSuccess(`Administrator "${username}" created.`);
      setUsername("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("viewer");
      setShowAddForm(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setAdding(false);
    }
  }

  async function removeAdmin(admin: AdminProfile) {
    const label =
      admin.full_name || emailById[admin.id] || "this administrator";

    if (
      !window.confirm(
        `Remove ${label}? This revokes their login access permanently.`
      )
    ) {
      return;
    }

    setSavingId(admin.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: admin.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to remove administrator."
        );
      }

      setSuccess("Administrator removed.");
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Administrators ({admins.length})
          </h2>

          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {showAddForm ? "Cancel" : "+ Add Admin"}
          </button>
        </div>

        {showAddForm && (
          <form
            onSubmit={addAdmin}
            className="mt-5 grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 sm:grid-cols-2"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone (optional — can be used to log in)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. +2348031234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password (min. 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={adding}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {adding ? "Creating…" : "Create Admin"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                  Admin
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                  Email
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                  Phone
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
                // Narrow nullable DB column for the disabled prop.
                const adminIsActive = admin.is_active === true;
                const isLastSuperAdmin =
                  admin.role === "super_admin" &&
                  adminIsActive &&
                  superAdminCount <= 1;
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

                    <td className="px-4 py-4 text-sm text-gray-600">
                      {emailById[admin.id] || "—"}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600">
                      {admin.phone || "—"}
                    </td>

                    <td className="px-4 py-4">
                      <select
                        value={admin.role || "viewer"}
                        disabled={isSelf || busy || isLastSuperAdmin}
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
                        disabled={busy}
                        onClick={() => openEditModal(admin)}
                        className="mr-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={isSelf || busy || isLastSuperAdmin}
                        onClick={() =>
                          updateAdmin(admin.id, {
                            is_active: !adminIsActive,
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

                      <button
                        type="button"
                        disabled={isSelf || busy || isLastSuperAdmin}
                        title={
                          isLastSuperAdmin
                            ? "Cannot remove the last active Super Admin"
                            : undefined
                        }
                        onClick={() => removeAdmin(admin)}
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {busy ? "…" : "Remove"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Administrator
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {emailById[editingAdmin.id] || "Update credentials"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone (leave empty to remove)
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g. +2348031234567"
                />
                <p className="mt-1 text-xs text-gray-500">
                  The admin can log in with this phone number and their
                  password.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  minLength={8}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
