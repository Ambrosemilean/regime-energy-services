import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: category } = await supabase
    .from("product_categories")
    .select("name, description")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) {
    return buildMetadata({
      title: "Category Not Found",
      description:
        "The product category you are looking for is not available on this website.",
      path: `/products/category/${slug}`,
    });
  }

  return buildMetadata({
    title: `${category.name} — LPG Products`,
    description:
      category.description ||
      `Explore ${category.name} available from Regime Energy Services.`,
    path: `/products/category/${slug}`,
  });
}

type ProductCard = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  size_capacity: string | null;
  specifications: string | null;
  availability: string | null;
  product_images: {
    image_url: string;
    alt_text: string | null;
    is_primary: boolean | null;
    display_order: number | null;
  }[];
};

export default async function ProductCategoryPage({
  params,
}: CategoryPageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  const [{ data: category }, { data: products }, { data: siblings }] =
    await Promise.all([
      supabase
        .from("product_categories")
        .select("id, name, slug, description")
        .eq("slug", slug)
        .maybeSingle(),
      supabase
        .from("products")
        .select(
          `id, name, slug, short_description, description, size_capacity,
          specifications, availability, category_id, product_images (
            image_url, alt_text, is_primary, display_order
          )`
        )
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
      supabase
        .from("product_categories")
        .select("name, slug")
        .order("name", { ascending: true }),
    ]);

  if (!category) {
    notFound();
  }

  // Filter to this category in memory (products were fetched once and
  // reused instead of issuing a dependent second query).
  const productList = ((products ?? []) as (ProductCard & {
    primary: { image_url: string; alt_text: string | null } | null;
    category_id: string | null;
  })[])
    .filter((product) => product.category_id === category.id)
    .map((product) => {
      const images = Array.isArray(product.product_images)
        ? [...product.product_images].sort(
            (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
          )
        : [];

      return {
        ...product,
        primary:
          images.find((image) => image.is_primary === true) ?? images[0] ?? null,
        imageCount: images.length,
      };
    });

  // Coordinated pastel card rotation for product cards.
  const PRODUCT_CARD_ROTATION = [
    "regime-card-sky",
    "regime-card-grey",
    "regime-card-blue",
    "regime-card-gold",
  ] as const;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader currentPath="/products" />

      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 md:pt-14">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
            <Link href="/what-we-do" className="hover:text-regime-blue">
              What We Do
            </Link>

            <span aria-hidden="true" className="mx-2">
              /
            </span>

            <span className="font-medium text-gray-800">{category.name}</span>
          </nav>

          <h1 className="regime-heading mt-4 text-3xl sm:text-4xl">
            {category.name}
          </h1>

          {category.description && (
            <p className="regime-lead mt-4 max-w-2xl">{category.description}</p>
          )}
        </section>

        {/* Products in this category */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          {productList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-600">
              No products in this category yet. Please contact us directly for
              enquiries.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {productList.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className={`${PRODUCT_CARD_ROTATION[index % PRODUCT_CARD_ROTATION.length]} group flex flex-col overflow-hidden`}
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                    {product.primary ? (
                      <Image
                        src={product.primary.image_url}
                        alt={product.primary.alt_text || product.name}
                        fill
                        quality={85}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain p-6 transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400">
                        No image available
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="font-bold text-gray-900 group-hover:text-regime-blue">
                      {product.name}
                    </h2>

                    <p className="mt-2 flex-1 text-sm leading-6 text-gray-600">
                      {product.short_description ||
                        product.description ||
                        "Quality LPG product available from Regime Energy Services."}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {product.size_capacity && (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          {product.size_capacity}
                        </span>
                      )}

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

                      <span className="ml-auto text-sm font-bold text-regime-blue group-hover:underline">
                        View details →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Related categories */}
          {siblings && siblings.length > 1 && (
            <div className="mt-14">
              <h2 className="text-lg font-bold text-gray-900">
                Other Product Categories
              </h2>

              <div className="mt-5 flex flex-wrap gap-2">
                {siblings
                  .filter((item) => item.slug !== category.slug)
                  .map((item) => (
                    <Link
                      key={item.slug}
                      href={`/products/category/${item.slug}`}
                      className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-regime-blue hover:text-regime-blue"
                    >
                      {item.name}
                    </Link>
                  ))}
              </div>
            </div>
          )}

          <Link
            href="/what-we-do#our-products"
            className="mt-10 inline-block text-sm font-semibold text-regime-blue hover:underline"
          >
            ← Back to What We Do
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
