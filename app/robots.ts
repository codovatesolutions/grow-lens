import { MetadataRoute } from "next";
import { headers } from "next/headers";

export default function robots(): MetadataRoute.Robots {
  const headersList = headers();
  const host = headersList.get("host") || "lensgrowth.com";
  const proto = headersList.get("x-forwarded-proto") || "https";
  const baseUrl = `${proto}://${host}`;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/_next/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
