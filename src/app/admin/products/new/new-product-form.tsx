"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createProduct } from "@/app/admin/products/actions/create-product";

type CategoryOption = {
  id: string;
  name: string;
};

export default function NewProductForm({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    const result = await createProduct(formData);

    if (!result.success) {
      setErrorMessage(result.message);
      setLoading(false);
      return;
    }

    setSuccessMessage(result.message);
    setLoading(false);
  }

  const imageFields = [
    { key: "primary", label: "Primary Image *", required: true },
    { key: "front", label: "Front Image", required: false },
    { key: "side", label: "Side Image", required: false },
    { key: "back", label: "Back Image", required: false },
    { key: "top", label: "Top Image", required: false },
    { key: "detail", label: "Detail Image", required: false },
  ];

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* Product Information */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Product Information
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Product Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className={inputClass}
              placeholder="e.g. 12.5kg Gas Cylinder"
            />
          </div>

          <div>
            <label
              htmlFor="category_id"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Category *
            </label>
            <select
              id="category_id"
              name="category_id"
              required
              defaultValue=""
              className={inputClass}
            >
              <option value="" disabled>
                Select a category
              </option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="availability"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Availability
            </label>
            <select
              id="availability"
              name="availability"
              defaultValue="available"
              className={inputClass}
            >
              <option value="available">Available</option>
              <option value="on_request">On Request</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="size_capacity"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Size / Capacity
            </label>
            <input
              id="size_capacity"
              name="size_capacity"
              type="text"
              className={inputClass}
              placeholder="e.g. 12.5kg"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="short_description"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Short Description
            </label>
            <input
              id="short_description"
              name="short_description"
              type="text"
              className={inputClass}
              placeholder="A one-line summary of the product"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Full Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="features"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Features
            </label>
            <textarea
              id="features"
              name="features"
              rows={4}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="specifications"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Specifications
            </label>
            <textarea
              id="specifications"
              name="specifications"
              rows={4}
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="suitable_use"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Suitable Use
            </label>
            <textarea
              id="suitable_use"
              name="suitable_use"
              rows={3}
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                name="is_featured"
                value="true"
                className="h-4 w-4 rounded border-gray-300"
              />
              Feature this product on the website
            </label>
          </div>
        </div>
      </div>

      {/* Product Images */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Product Images
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Upload a primary image plus at least 3 more images (4
          total). JPG, PNG, or WEBP, up to 5MB each.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {imageFields.map((field) => (
            <div key={field.key}>
              <label
                htmlFor={`image_${field.key}`}
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                {field.label}
              </label>
              <input
                id={`image_${field.key}`}
                name={`image_${field.key}`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required={field.required}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating product..." : "Create Product"}
        </button>

        <Link
          href="/admin/products"
          className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
