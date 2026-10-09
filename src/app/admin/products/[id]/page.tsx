import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductViewPage({
  params,
}: ProductPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      short_description,
      description,
      size_capacity,
      features,
      specifications,
      suitable_use,
      availability,
      is_featured,
      is_active,
      created_at,
      product_categories (
        id,
        name,
        slug
      ),
      product_images (
        id,
        image_url,
        alt_text,
        image_type,
        is_primary,
        display_order
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !product) {
    notFound();
  }

  const category = Array.isArray(product.product_categories)
    ? product.product_categories[0]
    : product.product_categories;

  const images = Array.isArray(product.product_images)
    ? [...product.product_images].sort(
        (a, b) => a.display_order - b.display_order
      )
    : [];

  const primaryImage =
    images.find((image) => image.is_primary === true) ??
    images[0];

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <Link
              href="/admin/products"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              ← Back to Products
            </Link>

            <p className="mt-4 text-sm font-medium text-blue-600">
              REGIME ENERGY SERVICES
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              {product.name}
            </h1>

            <p className="mt-2 text-gray-600">
              Product details and uploaded images.
            </p>
          </div>

          <div className="flex gap-3">

            <Link
              href={`/products/${product.slug}`}
              target="_blank"
              className="rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              View on Website ↗
            </Link>

            <Link
              href="/admin/products"
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Back
            </Link>

          </div>
        </div>

        {/* Product Overview */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Images */}
          <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">

            {/* Main Image */}
            <div className="aspect-video overflow-hidden rounded-xl border border-gray-200 bg-gray-50">

              {primaryImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primaryImage.image_url}
                    alt={
                      primaryImage.alt_text ||
                      `${product.name} primary image`
                    }
                    className="h-full w-full object-contain"
                  />
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No product image available
                </div>
              )}

            </div>

            {/* Image Gallery */}
            {images.length > 0 && (
              <div className="mt-6">

                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Product Images ({images.length})
                </h2>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">

                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                    >

                      <div className="aspect-square">

                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.image_url}
                          alt={
                            image.alt_text ||
                            `${product.name} ${image.image_type} image`
                          }
                          className="h-full w-full object-cover"
                        />

                      </div>

                      <div className="border-t border-gray-200 bg-white p-3">

                        <p className="text-xs font-semibold capitalize text-gray-700">
                          {image.image_type}
                        </p>

                        {image.is_primary && (
                          <p className="mt-1 text-xs font-semibold text-blue-600">
                            Primary Image
                          </p>
                        )}

                      </div>

                    </div>
                  ))}

                </div>

              </div>
            )}

          </div>

          {/* Status */}
          <div className="space-y-6">

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="text-lg font-semibold text-gray-900">
                Product Status
              </h2>

              <div className="mt-5 space-y-5">

                {/* Category */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Category
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {category?.name || "Uncategorized"}
                  </p>
                </div>

                {/* Availability */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Availability
                  </p>

                  <div className="mt-2">

                    {product.availability === "available" && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        Available
                      </span>
                    )}

                    {product.availability === "on_request" && (
                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                        On Request
                      </span>
                    )}

                    {product.availability === "unavailable" && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                        Unavailable
                      </span>
                    )}

                  </div>
                </div>

                {/* Featured */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Featured Product
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {product.is_featured ? "Yes" : "No"}
                  </p>
                </div>

                {/* Website Status */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Website Status
                  </p>

                  <p
                    className={`mt-1 text-sm font-medium ${
                      product.is_active
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </p>
                </div>

              </div>

            </div>

            {/* Additional Information */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="text-lg font-semibold text-gray-900">
                Additional Information
              </h2>

              <div className="mt-5 space-y-5">

                {/* Slug */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Product Slug
                  </p>

                  <p className="mt-1 break-all text-sm text-gray-700">
                    {product.slug}
                  </p>
                </div>

                {/* Image Count */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Uploaded Images
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {images.length}
                  </p>
                </div>

                {/* Date */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Date Added
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {new Date(
                      product.created_at
                    ).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Product Details */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-gray-900">
            Product Details
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">

            {/* Short Description */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Short Description
              </h3>

              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-gray-600">
                {product.short_description ||
                  "No short description provided."}
              </p>
            </div>

            {/* Size / Capacity */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Size / Capacity
              </h3>

              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-gray-600">
                {product.size_capacity ||
                  "No size or capacity information provided."}
              </p>
            </div>

            {/* Full Description */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Full Description
              </h3>

              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-gray-600">
                {product.description ||
                  "No full description provided."}
              </p>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Features
              </h3>

              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-gray-600">
                {product.features ||
                  "No features provided."}
              </p>
            </div>

            {/* Specifications */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Specifications
              </h3>

              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-gray-600">
                {product.specifications ||
                  "No specifications provided."}
              </p>
            </div>

            {/* Suitable Use */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Suitable Use
              </h3>

              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-gray-600">
                {product.suitable_use ||
                  "No suitable-use information provided."}
              </p>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}
