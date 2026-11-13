"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updateProduct,
  deleteProduct,
} from "@/app/admin/products/actions/create-product";

type CategoryOption = {
  id: string;
  name: string;
};

type EditableProduct = {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  short_description: string | null;
  description: string | null;
  size_capacity: string | null;
  features: string | null;
  specifications: string | null;
  suitable_use: string | null;
  availability: string | null;
  is_featured: boolean | null;
  is_active: boolean | null;
};

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600";

export default function EditProductForm({
  product,
  categories,
}: {
  product: EditableProduct;
  categories: CategoryOption[];
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

    const result = await updateProduct(formData);

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
    formData.append("product_id", product.id);

    const result = await deleteProduct(formData);

    if (!result.success) {
      setErrorMessage(result.message);
      setDeleting(false);
      setShowConfirm(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={`/admin/products/${product.id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to product
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Edit Product
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
          Delete Product
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
                defaultValue={product.name}
                className={inputClass}
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
                defaultValue={product.category_id ?? ""}
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
                defaultValue={product.availability ?? "available"}
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
                defaultValue={product.size_capacity ?? ""}
                className={inputClass}
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
                defaultValue={product.short_description ?? ""}
                className={inputClass}
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
                defaultValue={product.description ?? ""}
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
                defaultValue={product.features ?? ""}
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
                defaultValue={product.specifications ?? ""}
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
                defaultValue={product.suitable_use ?? ""}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-3">
              <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  name="is_featured"
                  value="true"
                  defaultChecked={product.is_featured === true}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Feature this product on the website
              </label>

              <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  name="is_active"
                  value="true"
                  defaultChecked={product.is_active !== false}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Show on the public website (active)
              </label>
            </div>
          </div>
        </div>

        {/* Replace primary image (optional) */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Replace Primary Image (optional)
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Leave empty to keep the current primary image. JPG, PNG,
            or WEBP, up to 5MB.
          </p>

          <input
            id="image_primary"
            name="image_primary"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700"
          />
        </div>

        {/* Hidden id + Actions */}
        <input type="hidden" name="product_id" value={product.id} />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>

          <Link
            href={`/admin/products/${product.id}`}
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
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
              Delete Product?
            </h2>

            <p className="mt-3 text-gray-600">
              Are you sure you want to permanently delete{" "}
              <strong>{product.name}</strong> and all of its images?
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
