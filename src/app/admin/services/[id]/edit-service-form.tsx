"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updateService,
  deleteService,
} from "@/app/admin/services/actions/create-service";

type EditableService = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  service_category: string | null;
  is_featured: boolean | null;
  is_active: boolean | null;
};

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500";

export default function EditServiceForm({
  service,
}: {
  service: EditableService;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");
    setMessage("");

    const formData = new FormData(event.currentTarget);

    const result = await updateService(formData);

    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }

    setMessage(result.message);
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("service_id", service.id);

    const result = await deleteService(formData);

    if (!result.success) {
      setErrorMessage(result.message);
      setDeleting(false);
      setShowConfirm(false);
      return;
    }

    router.push("/admin/services");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={`/admin/services/${service.id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to service
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Edit Service
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Changes are saved directly to the database.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Delete Service
        </button>
      </div>

      {message && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Service Name */}
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Service Name *
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={service.name}
            className={inputClass}
          />
        </div>

        {/* Service Category */}
        <div>
          <label
            htmlFor="service_category"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Service Category
          </label>

          <input
            id="service_category"
            name="service_category"
            type="text"
            defaultValue={service.service_category ?? ""}
            className={inputClass}
          />
        </div>

        {/* Short Description */}
        <div>
          <label
            htmlFor="short_description"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Short Description
          </label>

          <input
            id="short_description"
            name="short_description"
            type="text"
            defaultValue={service.short_description ?? ""}
            className={inputClass}
          />
        </div>

        {/* Full Description */}
        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Full Description
          </label>

          <textarea
            id="description"
            name="description"
            rows={6}
            defaultValue={service.description ?? ""}
            className={inputClass}
          />
        </div>

        {/* Replace primary image (optional) */}
        <div>
          <label
            htmlFor="image_primary"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Replace Primary Image (optional)
          </label>

          <p className="mb-3 text-sm text-gray-500">
            Leave empty to keep the current primary image. JPG, PNG,
            or WEBP, up to 5MB.
          </p>

          <input
            id="image_primary"
            name="image_primary"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full cursor-pointer rounded-lg border border-gray-300 p-2 text-sm"
          />
        </div>

        {/* Flags */}
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              name="is_featured"
              value="true"
              defaultChecked={service.is_featured === true}
              className="h-4 w-4 rounded border-gray-300"
            />
            Feature this service
          </label>

          <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              name="is_active"
              value="true"
              defaultChecked={service.is_active !== false}
              className="h-4 w-4 rounded border-gray-300"
            />
            Show on the public website (active)
          </label>
        </div>

        {/* Hidden id + Actions */}
        <input type="hidden" name="service_id" value={service.id} />

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>

          <Link
            href={`/admin/services/${service.id}`}
            className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* Delete confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">
              Delete Service?
            </h2>

            <p className="mt-3 text-gray-600">
              Are you sure you want to permanently delete{" "}
              <strong>{service.name}</strong> and all of its images?
            </p>

            <p className="mt-2 text-sm text-red-600">
              This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-5 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
