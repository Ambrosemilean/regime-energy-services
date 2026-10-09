import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ProductsPage() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      short_description,
      availability,
      is_featured,
      is_active,
      created_at,
      product_categories (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false });

  const productList = products ?? [];

  const totalProducts = productList.length;

  const availableProducts = productList.filter(
    (product) => product.availability === "available"
  ).length;

  const onRequestProducts = productList.filter(
    (product) => product.availability === "on_request"
  ).length;

  const unavailableProducts = productList.filter(
    (product) => product.availability === "unavailable"
  ).length;

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              REGIME ENERGY SERVICES
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Products
            </h1>

            <p className="mt-2 text-gray-600">
              Manage gas cylinders, regulators, valves, burners,
              cookers, accessories, and other products.
            </p>
          </div>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + Add Product
          </Link>
        </div>

        {/* Statistics */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Total Products */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Products
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalProducts}
            </p>
          </div>

          {/* Available */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Available
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {availableProducts}
            </p>
          </div>

          {/* On Request */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              On Request
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {onRequestProducts}
            </p>
          </div>

          {/* Unavailable */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Unavailable
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {unavailableProducts}
            </p>
          </div>

        </div>

        {/* Product Catalogue */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Product Catalogue
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Products added to the Regime website will appear here.
            </p>
          </div>

          {/* Database Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              Unable to load products from the database.
            </div>
          )}

          {/* Empty State */}
          {!error && productList.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">

              <h3 className="text-lg font-semibold text-gray-900">
                No products yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                Your product database is ready. Add your first
                Regime product to begin building the catalogue.
              </p>

              <Link
                href="/admin/products/new"
                className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Add Your First Product
              </Link>

            </div>
          )}

          {/* Product Table */}
          {!error && productList.length > 0 && (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px] text-left">

                <thead>
                  <tr className="border-b border-gray-200">

                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                      Product
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                      Category
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                      Availability
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                      Featured
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                      Status
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {productList.map((product) => {
                    const category = Array.isArray(
                      product.product_categories
                    )
                      ? product.product_categories[0]
                      : product.product_categories;

                    return (
                      <tr
                        key={product.id}
                        className="border-b border-gray-100 last:border-0"
                      >

                        {/* Product */}
                        <td className="px-4 py-4">

                          <p className="font-semibold text-gray-900">
                            {product.name}
                          </p>

                          {product.short_description && (
                            <p className="mt-1 max-w-md truncate text-sm text-gray-500">
                              {product.short_description}
                            </p>
                          )}

                        </td>

                        {/* Category */}
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {category?.name || "Uncategorized"}
                        </td>

                        {/* Availability */}
                        <td className="px-4 py-4">

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

                        </td>

                        {/* Featured */}
                        <td className="px-4 py-4 text-sm">

                          {product.is_featured ? (
                            <span className="font-medium text-blue-600">
                              Yes
                            </span>
                          ) : (
                            <span className="text-gray-400">
                              No
                            </span>
                          )}

                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 text-sm">

                          {product.is_active ? (
                            <span className="font-medium text-green-600">
                              Active
                            </span>
                          ) : (
                            <span className="font-medium text-gray-400">
                              Inactive
                            </span>
                          )}

                        </td>

                        {/* Action */}
                        <td className="px-4 py-4 text-right">

                          <Link
                            href={`/admin/products/${product.id}`}
                            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                          >
                            Manage
                          </Link>

                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                          >
                            Website ↗
                          </Link>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </main>
  );
}