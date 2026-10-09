/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewBranchForm() {
  const router = useRouter();

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleImageChange(file: File | null) {
    setError("");

    if (!file) {
      setImage(null);
      setPreview(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WEBP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must not be larger than 5MB.");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (image) {
      formData.append("image", image);
    }

    try {
      const response = await fetch("/api/admin/branches", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create branch.");
      }

      router.push("/admin/branches");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create branch."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      {/* Branch Image */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Branch Image
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Upload a clear photo of this Regime branch.
        </p>

        <div className="mt-5">
          {preview ? (
            <div className="space-y-4">
              <img
                src={preview}
                alt="Branch preview"
                className="h-64 w-full rounded-lg object-cover"
              />

              <button
                type="button"
                onClick={() => handleImageChange(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Remove Image
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-12 text-center hover:border-gray-400">
              <div className="text-4xl">📷</div>

              <p className="mt-3 text-sm font-medium text-gray-900">
                Click to upload branch image
              </p>

              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG or WEBP · Maximum 5MB
              </p>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) =>
                  handleImageChange(
                    event.target.files?.[0] || null
                  )
                }
              />
            </label>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Branch Information
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Branch Name *
            </label>

            <input
              name="name"
              required
              type="text"
              placeholder="Regime Gas Plant Owerri"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Display Order
            </label>

            <input
              name="display_order"
              type="number"
              defaultValue="0"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Address *
            </label>

            <textarea
              name="address"
              required
              rows={3}
              placeholder="Enter complete branch address"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>

            <input
              name="phone"
              type="text"
              placeholder="080..."
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              WhatsApp
            </label>

            <input
              name="whatsapp"
              type="text"
              placeholder="080..."
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>

            <input
              name="email"
              type="email"
              placeholder="branch@regimeenergyservices.com"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Google Maps URL
            </label>

            <input
              name="google_maps_url"
              type="url"
              placeholder="https://maps.google.com/..."
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Coordinates */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Location Coordinates
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Leave these blank if the coordinates are not available yet.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Latitude
            </label>

            <input
              name="latitude"
              type="number"
              step="any"
              placeholder="5.000000"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Longitude
            </label>

            <input
              name="longitude"
              type="number"
              step="any"
              placeholder="7.000000"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Description
        </h2>

        <textarea
          name="description"
          rows={5}
          placeholder="Describe this Regime branch..."
          className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
        />
      </div>

      {/* Status */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <label className="flex items-center gap-3">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked
            className="h-5 w-5 rounded border-gray-300"
          />

          <span>
            <span className="block font-medium text-gray-900">
              Active Branch
            </span>

            <span className="block text-sm text-gray-500">
              Show this branch on the website.
            </span>
          </span>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.push("/admin/branches")}
          className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating Branch..." : "Create Branch"}
        </button>
      </div>
    </form>
  );
}