import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export function getLinksMetadata(id?: string): Metadata {
  return createPageMetadata({
    title: "Links",
    description: "A curated list of important links.",
    path: id ? `/l/${id}` : undefined,
  });
}


