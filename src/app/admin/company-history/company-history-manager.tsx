"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Milestone = {
  id: string;
  year: string;
  title: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
};

type Draft = {
  id?: string;
  year: string;
  title: string;
  description: string;
  display_order: number;
  is_active: boolean;
};

const emptyDraft: Draft = {
  year: "",
  title: "",
  description: "",
  display_order: 0,
  is_active: true,
};

export default function CompanyHistoryManager({
  milestones,
}: {
  milestones: Milestone[];
}) {
  const router = useRouter();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function startCreate() {
    setSuccess("");
    setError("");
    setDraft({ ...emptyDraft });
  }

  function startEdit(milestone: Milestone) {
    setSuccess("");
    setError("");
    setDraft({
      id: milestone.id,
      year: milestone.year,
      title: milestone.title,
      description: milestone.description || "",
      display_order: milestone.display_order,
      is_active: milestone.is_active,
    });
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/company-history", {
        method: draft.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save milestone.");
      }

      setDraft(null);
      setSuccess("Milestone saved successfully.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this milestone? This cannot be undone.")) {
      return;
    }

    setError("");
    setSuccess("");

    const response = await fetch(
      `/api/admin/company-history?id=${id}`,
      { method: "DELETE" }
    );

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Failed to delete milestone.");
      return;
    }

    setSuccess("Milestone deleted.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          {milestones.length} milestone
          {milestones.length === 1 ? "" : "s"} saved.
        </p>

        {!draft && (
          <button
            type="button"
            onClick={startCreate}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Add Milestone
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && !draft && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Form */}
      {draft && (
        <form
          onSubmit={handleSave}
          className="rounded-xl border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900">
            {draft.id ? "Edit Milestone" : "New Milestone"}
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <div>
              <label
                htmlFor="year"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Year *
              </label>

              <input
                id="year"
                type="text"
                value={draft.year}
                onChange={(event) =>
                  setDraft({ ...draft, year: event.target.value })
                }
                required
                placeholder="2015"
                className="w-full rounded-lg border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Title *
              </label>

              <input
                id="title"
                type="text"
                value={draft.title}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
                required
                placeholder="Founded in Lagos"
                className="w-full rounded-lg border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-3">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Description
              </label>

              <textarea
                id="description"
                value={draft.description}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    description: event.target.value,
                  })
                }
                rows={4}
                placeholder="Describe what happened in this year..."
                className="w-full rounded-lg border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="display_order"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Display Order
              </label>

              <input
                id="display_order"
                type="number"
                value={draft.display_order}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    display_order: Number(event.target.value),
                  })
                }
                className="w-full rounded-lg border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-center">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      is_active: event.target.checked,
                    })
                  }
                  className="h-5 w-5 rounded border-gray-300"
                />

                <span className="text-sm font-medium text-gray-700">
                  Show on website
                </span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-lg border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Milestone"}
            </button>
          </div>
        </form>
      )}

      {/* Milestones list */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        {milestones.length === 0 ? (
          <div className="rounded-xl border-dashed border-gray-300 p-10 text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              No milestones yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Add your first milestone to start building the
              company history timeline shown on the website.
            </p>
          </div>
        ) : (
          <ol className="space-y-4">
            {milestones.map((milestone) => (
              <li
                key={milestone.id}
                className="flex flex-col gap-3 rounded-xl border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                      {milestone.year}
                    </span>

                    <h3 className="font-semibold text-gray-900">
                      {milestone.title}
                    </h3>

                    {!milestone.is_active && (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                        Hidden
                      </span>
                    )}
                  </div>

                  {milestone.description && (
                    <p className="mt-2 max-w-3xl text-sm text-gray-600">
                      {milestone.description}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(milestone)}
                    className="rounded-lg border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(milestone.id)}
                    className="rounded-lg border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
