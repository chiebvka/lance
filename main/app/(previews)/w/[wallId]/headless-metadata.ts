import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export function getWallMetadata(id?: string): Metadata {
  return createPageMetadata({
    title: "Wall",
    description: "Share instructions, media and links in one elegant page.",
    path: id ? `/w/${id}` : undefined,
  });
}


