import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Do not disclose the admin URL in robots.txt (it advertises
        // the panel to scanners). Public pages remain fully crawlable.
        disallow: ["/api"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
