import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/seller", "/admin", "/settings", "/checkout"],
    },
    sitemap: "https://realestate-gh.example.com/sitemap.xml",
  };
}
