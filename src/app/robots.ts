import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/api/webhooks/", "/vault", "/vault/", "/admin", "/admin/"],
    },
    sitemap: "https://cognitiveedgeclinic.com/sitemap.xml",
  };
}
