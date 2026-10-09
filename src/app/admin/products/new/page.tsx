import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NewProductForm from "./new-product-form";

export default async function NewProductPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("product_categories")
    .select("id, name")
    .order("name", { ascending: true });

  const categoryOptions = categories ?? [];

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
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
            Add New Product
          </h1>

          <p className="mt-2 text-gray-600">
            Create a new product for the Regime Energy Services
            website.
          </p>
        </div>

        {categoryOptions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              No categories yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              A product category is required before a product can
              be created. Add categories to the
              product_categories table first.
            </p>
          </div>
        ) : (
          <NewProductForm categories={categoryOptions} />
        )}
      </div>
    </main>
  );
}
