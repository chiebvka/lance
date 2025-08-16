import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export function getProjectMetadata(id?: string): Metadata {
  return createPageMetadata({
    title: "Project Wall",
    description: "Handover instructions and assets in one place.",
    path: id ? `/p/${id}` : undefined,
  });
}


