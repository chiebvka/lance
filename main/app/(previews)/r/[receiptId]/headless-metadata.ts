import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export function getReceiptMetadata(id?: string): Metadata {
  return createPageMetadata({
    title: "Receipt",
    description: "Payment confirmation and receipt details.",
    path: id ? `/r/${id}` : undefined,
  });
}


