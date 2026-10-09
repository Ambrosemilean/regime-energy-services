/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createService } from "../actions/create-service";

type ImageKey =
  | "primary"
  | "front"
  | "side"
  | "back"
  | "top"
  | "detail";

type ImageSlot = {
  key: ImageKey;
  label: string;
  required?: boolean;
};

const imageSlots: ImageSlot[] = [
  {
    key: "primary",
    label: "Primary Image",
    required: true,
  },
  {
    key: "front",
    label: "Front View",
  },
  {
    key: "side",
    label: "Side View",
  },
  {
    key: "back",
    label: "Back View",
  },
  {
    key: "top",
    label: "Top / Up View",
  },
  {
    key: "detail",
    label: "Detail / Close-up",
  },
];

export default function NewServiceForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [previews, setPreviews] = useState<
    Partial<Record<ImageKey, string>>
  >({});

  function handleImageChange(
    key: ImageKey,
    file: File | undefined
  ) {
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage(
        "Only JPG, PNG, and WEBP images are allowed."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage(
        "Each image must be 5MB or smaller."
      );
      return;
    }

    setMessage("");

    const previewUrl = URL.createObjectURL(file);

    setPreviews((current) => ({
      ...current,
      [key]: previewUrl,
    }));
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMessage("");

    const primaryImage = formData.get("image_primary");

    if (
      !primaryImage ||
      !(primaryImage instanceof File) ||
      primaryImage.size === 0
    ) {
      setMessage("Please select a primary service image.");
      setLoading(false);
      return;
    }

    const result = await createService(formData);

    setLoading(false);

    if (!result.success) {
      setMessage(result.message);
      return;
    }

    alert(result.message);

    router.push("/admin/services");
    router.refresh();
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
    >
      {/* Service Name */}
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          Service Name
        </label>

        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. LPG Gas Refill"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
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
          placeholder="e.g. LPG Services"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
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
          placeholder="Brief description of the service"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
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
          placeholder="Describe this service in detail..."
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* Service Images */}
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Service Images
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Upload JPG, PNG, or WEBP images. Maximum 5MB per image.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {imageSlots.map((slot) => (
            <div
              key={slot.key}
              className="rounded-xl border border-gray-200 p-5"
            >
              <label
                htmlFor={`image_${slot.key}`}
                className="mb-3 block text-sm font-semibold text-gray-700"
              >
                {slot.label}

                {slot.required && (
                  <span className="ml-1 text-red-600">
                    *
                  </span>
                )}
              </label>

              <input
                id={`image_${slot.key}`}
                name={`image_${slot.key}`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required={slot.required}
                onChange={(event) =>
                  handleImageChange(
                    slot.key,
                    event.target.files?.[0]
                  )
                }
                className="block w-full cursor-pointer rounded-lg border border-gray-300 p-2 text-sm"
              />

              {previews[slot.key] && (
                <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                  <img
                    src={previews[slot.key]}
                    alt={`${slot.label} preview`}
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Featured */}
      <div className="flex items-center gap-3">
        <input
          id="is_featured"
          name="is_featured"
          type="checkbox"
          value="true"
          className="h-4 w-4 rounded border-gray-300"
        />

        <label
          htmlFor="is_featured"
          className="text-sm font-medium text-gray-700"
        >
          Feature this service
        </label>
      </div>

      {/* Error */}
      {message && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {message}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Creating Service..."
            : "Create Service"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/services")}
          className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}