import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Our Products — Regime Energy Services",
  description:
    "Explore cylinders, regulators, valves, burners, cookers, hoses and other LPG accessories available from Regime Energy Services.",
};

type ProductCard = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  availability: string;
  display_order: number | null;
  product_images: {
    image_url: string;
    alt_text: string | null;
    is_primary: boolean | null;
    display_order: number | null;
  }[];
};

type ProductsPageProps = {
  searchParams: Promise<{
    search?: string;
  }>;
};

export default async function ProductsListPage({
  searchParams,
}: ProductsPageProps) {
  const supabase = await createClient();

  const params = await searchParams;
  const search = params.search?.trim() || "";

  let query = supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      short_description,
      availability,
      display_order,
      product_images (
        image_url,
        alt_text,
        is_primary,
        display_order
      )
    `
    )
    .eq("is_active", true);

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,short_description.ilike.%${search}%`
    );
  }

  const { data: products, error } = await query
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  const productList: ProductCard[] = (products ?? []) as ProductCard[];

  function primaryImage(product: ProductCard) {
    const images = Array.isArray(product.product_images)
      ? [...product.product_images].sort(
          (a, b) =>
            (a.display_order ?? 0) - (b.display_order ?? 0)
        )
      : [];

    return (
      images.find((image) => image.is_primary === true) ??
      images[0]
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-xl font-bold text-blue-700"
          >
            Regime Energy Services
          </Link>

          <Link
            href="/"
            className="text-sm font-medium text-gray-700 hover:text-blue-700"
          >
            ← Back to Home
          </Link>
        </div>
      </section>

      {/* Page Intro */}
      <section className="mx-auto max-w-7xl px-6 pb-6 pt-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
          Regime Energy Services
        </p>

        <h1 className="mt-3 text-3xl font-bold text-gray-900 md:text-5xl">
          Our Products
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-600">
          Explore cylinders, regulators, valves, burners, cookers,
          hoses and other LPG accessories available from Regime.
        </p>
      </section>

      {/* Product Search */}
      <section className="mx-auto max-w-3xl px-6 pb-10">
        <form
          method="GET"
          action="/products"
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <label
              htmlFor="product-search"
              className="sr-only"
            >
              Search products
            </label>

            <input
              id="product-search"
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Search products e.g. cylinder, regulator, burner..."
              className="w-full rounded-xl border border-gray-300 bg-white px-5 py-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-blue-700 px-7 py-4 font-semibold text-white transition hover:bg-blue-800"
          >
            Search
          </button>

          {search && (
            <Link
              href="/products"
              className="rounded-xl border border-gray-300 px-7 py-4 text-center font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Clear
            </Link>
          )}
        </form>

        {search && (
          <p className="mt-4 text-center text-sm text-gray-500">
            Showing results for{" "}
            <span className="font-semibold text-gray-800">
              &quot;{search}&quot;
            </span>
          </p>
        )}
      </section>

      {/* Product Grid */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-700">
            Unable to load products right now. Please try again
            later.
          </div>
        )}

        {!error && productList.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 p-14 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {search
                ? "No matching products found"
                : "No products available yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              {search
                ? "Try another product name or search term."
                : "Our product catalogue is being updated. Please check back soon or contact us directly for enquiries."}
            </p>

            {search && (
              <Link
                href="/products"
                className="mt-5 inline-block rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800"
              >
                View All Products
              </Link>
            )}
          </div>
        )}

        {!error && productList.length > 0 && (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {productList.map((product) => {
              const image = primaryImage(product);

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
                    {image ? (
                      <Image
                        src={image.image_url}
                        alt={
                          image.alt_text ||
                          `${product.name} product image`
                        }
                        fill
                        quality={85}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain p-6 transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400">
                        No image available
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700">
                      {product.name}
                    </h2>

                    {product.short_description && (
                      <p className="mt-2 flex-1 text-sm leading-6 text-gray-600">
                        {product.short_description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between">
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

                      <span className="text-sm font-semibold text-blue-700 group-hover:underline">
                        View details →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}