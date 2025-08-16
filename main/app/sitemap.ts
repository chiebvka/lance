import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    "",
    "/pricing",
    "/blogs",
    "/branding",
    "/policy",
    "/terms",
    "/logs",
    "/login",
    "/sign-up",
  ];

  const now = new Date();
  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.6,
  }));
}


