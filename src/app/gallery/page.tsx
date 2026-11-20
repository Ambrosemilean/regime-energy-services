import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Projects & Gallery | Regime Energy Services",
  description:
    "A look at Regime Energy Services projects, plants, branches and operations across Imo State.",
};

type MediaRow = {
  id: string;
  title: string | null;
  image_url: string;
  alt_text: string | null;
  description: string | null;
  project: string | null;
  display_order: number | null;
};

/**
 * Projects & Gallery — every active company media item, shown together so
 * the gallery fills with all available imagery (photos, renders and
 * AI-generated visuals alike). Grouped under simple project headings
 * derived from each item's `project` field (set from the admin media
 * manager), with a chip on each card.
 */
export default async function GalleryPage() {
  const supabase = await createClient();

  const { data: media } = await supabase
    .from("company_media")
    .select("id, title, image_url, alt_text, description, project, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  const mediaList = (media ?? []) as MediaRow[];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader currentPath="/gallery" />

      <main className="flex-1">
        {/* Page heading */}
        <section className="bg-regime-blue-dark px-4 py-14 text-white sm:px-6 md:py-20">
          <div className="mx-auto max-w-7xl">
            <span className="regime-accent-chip bg-white/95">
              Projects &amp; Gallery
            </span>

            <h1 className="mt-5 text-3xl font-bold sm:text-5xl">
              Our Work, On Display
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-blue-100 sm:text-lg">
              Plants, branches, deliveries and equipment — a visual record of
              Regime Energy Services at work across Imo State.
            </p>
          </div>
        </section>

        {/* Gallery grid */}
        <section className="px-4 py-12 sm:px-6 md:py-16">
          <div className="mx-auto max-w-7xl">
            {mediaList.length > 0 ? (
              <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [column-fill:_balance]">
                {mediaList.map((item) => (
                  <figure
                    key={item.id}
                    className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
                  >
                    {/* Title above the image */}
                    {item.title && (
                      <div className="px-4 pb-3 pt-3">
                        <h3 className="text-sm font-bold text-gray-900 sm:text-base">
                          {item.title}
                        </h3>

                        {item.project && (
                          <span className="mt-1 inline-block rounded-full bg-regime-blue-dark/10 px-2.5 py-0.5 text-xs font-semibold text-regime-blue-dark">
                            {item.project}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={item.image_url}
                        alt={
                          item.alt_text ||
                          item.title ||
                          "Regime Energy Services gallery image"
                        }
                        fill
                        quality={80}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition duration-300 hover:scale-105"
                      />
                    </div>

                    {/* Description below the image */}
                    {item.description && (
                      <figcaption className="px-4 py-3 text-sm leading-6 text-gray-600">
                        {item.description}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
                <p className="text-gray-600">
                  Our project photos will be displayed here soon.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
