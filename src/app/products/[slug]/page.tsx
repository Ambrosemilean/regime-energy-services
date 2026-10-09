import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ProductImage = {
  id: string;
  image_url: string;
  alt_text: string | null;
  image_type: string | null;
  is_primary: boolean | null;
  display_order: number | null;
};

export default async function ProductDetailsPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  // Get active company WhatsApp number
  const { data: company } = await supabase
    .from("company_profile")
    .select("whatsapp")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const whatsappNumber = company?.whatsapp
    ? company.whatsapp.replace(/\D/g, "")
    : "";

  // Get product
  const { data: product, error } = await supabase
    .from("products")
    .select(`
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
      display_order,
      product_images (
        id,
        image_url,
        alt_text,
        image_type,
        is_primary,
        display_order
      )
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Product loading error:", error);
  }

  if (!product) {
    notFound();
  }

  const images: ProductImage[] = Array.isArray(
    product.product_images
  )
    ? [...product.product_images].sort(
        (a, b) =>
          (a.display_order ?? 0) -
          (b.display_order ?? 0)
      )
    : [];

  const primaryImage =
    images.find(
      (image) => image.is_primary === true
    ) ?? images[0];

  const availability = product.availability;

  function getAvailabilityLabel() {
    switch (availability) {
      case "available":
        return "Available";

      case "on_request":
        return "On Request";

      case "unavailable":
        return "Unavailable";

      default:
        return "Contact us";
    }
  }

  function getAvailabilityClasses() {
    switch (availability) {
      case "available":
        return "bg-green-100 text-green-700";

      case "on_request":
        return "bg-yellow-100 text-yellow-700";

      case "unavailable":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
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
            href="/products"
            className="text-sm font-medium text-gray-700 transition hover:text-blue-700"
          >
            ← Back to Products
          </Link>
        </div>
      </section>

      {/* Product */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          {/* Product Images */}
          <div>
            <div className="relative overflow-hidden rounded-2xl bg-gray-50">
              {primaryImage ? (
                <div className="relative aspect-square w-full">
                  <Image
                    src={primaryImage.image_url}
                    alt={
                      primaryImage.alt_text ||
                      `${product.name} primary image`
                    }
                    fill
                    priority
                    quality={90}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain p-6"
                  />
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center text-gray-400">
                  No product image available
                </div>
              )}
            </div>

            {/* Image Gallery */}
            {images.length > 1 && (
              <div className="mt-4">
                <h2 className="mb-3 text-sm font-semibold text-gray-700">
                  Product Images
                </h2>

                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                    >
                      <Image
                        src={image.image_url}
                        alt={
                          image.alt_text ||
                          `${product.name} ${
                            image.image_type || ""
                          } image`
                        }
                        fill
                        quality={80}
                        sizes="(max-width: 640px) 25vw, 150px"
                        className="object-contain p-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Information */}
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                Regime Energy Services
              </p>

              {product.is_featured && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Featured Product
                </span>
              )}
            </div>

            <h1 className="mt-3 text-3xl font-bold text-gray-900 md:text-5xl">
              {product.name}
            </h1>

            {product.short_description && (
              <p className="mt-5 text-lg leading-8 text-gray-600">
                {product.short_description}
              </p>
            )}

            {/* Availability */}
            <div className="mt-6">
              <span
                className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${getAvailabilityClasses()}`}
              >
                {getAvailabilityLabel()}
              </span>
            </div>

            {/* Size / Capacity */}
            {product.size_capacity && (
              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Size / Capacity
                </p>

                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {product.size_capacity}
                </p>
              </div>
            )}

            <div className="mt-8 h-px bg-gray-200" />

            {/* Description */}
            {product.description && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900">
                  Product Description
                </h2>

                <p className="mt-4 whitespace-pre-line leading-8 text-gray-600">
                  {product.description}
                </p>
              </div>
            )}

            {/* Features */}
            {product.features && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900">
                  Features
                </h2>

                <div className="mt-4 whitespace-pre-line leading-8 text-gray-600">
                  {product.features}
                </div>
              </div>
            )}

            {/* Specifications */}
            {product.specifications && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900">
                  Specifications
                </h2>

                <div className="mt-4 whitespace-pre-line leading-8 text-gray-600">
                  {product.specifications}
                </div>
              </div>
            )}

            {/* Suitable Use */}
            {product.suitable_use && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900">
                  Suitable Use
                </h2>

                <p className="mt-4 whitespace-pre-line leading-8 text-gray-600">
                  {product.suitable_use}
                </p>
              </div>
            )}

            {/* WhatsApp Enquiry */}
            <div className="mt-10 rounded-2xl bg-gray-50 p-6">
              <h2 className="text-lg font-bold text-gray-900">
                Interested in this product?
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Contact Regime Energy Services for availability,
                pricing, and product enquiries.
              </p>

              {whatsappNumber ? (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
                >
                  Enquire on WhatsApp
                </a>
              ) : (
                <p className="mt-5 text-sm font-medium text-gray-500">
                  WhatsApp contact is currently unavailable.
                </p>
              )}
            </div>

            <Link
              href="/products"
              className="mt-6 inline-block text-sm font-semibold text-blue-700 hover:underline"
            >
              ← View all products
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}