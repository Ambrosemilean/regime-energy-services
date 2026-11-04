import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";

/**
 * XML sitemap built from the static routes plus every active product,
 * service and branch stored in Supabase.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/services`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/branches`, changeFrequency: "monthly", priority: 0.8 },
    {
      url: `${SITE_URL}/company-history`,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    { url: `${SITE_URL}/chat`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const supabase = await createClient();

    const [products, services, branches] = await Promise.all([
      supabase.from("products").select("slug").eq("is_active", true),
      supabase.from("services").select("slug").eq("is_active", true),
      supabase.from("branches").select("slug").eq("is_active", true),
    ]);

    const dynamicEntries: MetadataRoute.Sitemap = [
      ...(products.data ?? []).map((row) => ({
        url: `${SITE_URL}/products/${row.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
      ...(services.data ?? []).map((row) => ({
        url: `${SITE_URL}/services/${row.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
      ...(branches.data ?? []).map((row) => ({
        url: `${SITE_URL}/branches/${row.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];

    return [...staticRoutes, ...dynamicEntries];
  } catch {
    // Database unavailable — still serve the static routes.
    return staticRoutes;
  }
}
